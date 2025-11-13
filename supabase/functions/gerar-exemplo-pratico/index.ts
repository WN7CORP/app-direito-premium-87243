import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.1";

const REVISION = "v2.0.0-exemplo-2025-11-05";
const MODEL = "gemini-2.0-flash";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  console.log(`📍 Function: gerar-exemplo-pratico@${REVISION}`);
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { palavra, significado } = await req.json();

    if (!palavra || !significado) {
      throw new Error("Palavra e significado são obrigatórios");
    }

    const DIREITO_PREMIUM_API_KEY = Deno.env.get("DIREITO_PREMIUM_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!DIREITO_PREMIUM_API_KEY) {
      throw new Error("DIREITO_PREMIUM_API_KEY não configurada");
    }
    
    console.log("✅ DIREITO_PREMIUM_API_KEY configurada");
    console.log(`🤖 Usando modelo: ${MODEL}`);

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Verificar se já existe exemplo prático em cache
    const { data: cached } = await supabase
      .from("DICIONARIO")
      .select("exemplo_pratico")
      .eq("Palavra", palavra)
      .maybeSingle();

    if (cached?.exemplo_pratico) {
      console.log("✅ Retornando exemplo prático do cache - 0 tokens gastos");
      return new Response(
        JSON.stringify({ exemplo: cached.exemplo_pratico, cached: true }),
        { 
          headers: { 
            ...corsHeaders, 
            "Content-Type": "application/json",
            "X-Function-Revision": REVISION,
            "X-Model": MODEL,
          } 
        }
      );
    }

    // Gerar novo exemplo com Gemini
    const prompt = `Crie um exemplo prático jurídico para o termo "${palavra}".

Significado: ${significado}

O exemplo deve:
- Ser uma situação real do dia a dia jurídico brasileiro
- Ter 2-3 frases
- Mostrar aplicação prática do conceito
- Ser claro e direto
- Usar linguagem técnica mas compreensível

Retorne APENAS o exemplo, sem introdução ou explicação adicional.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${DIREITO_PREMIUM_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 500,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Erro da API Gemini:", response.status, errorText);
      return new Response(
        JSON.stringify({
          error: `Erro ao gerar exemplo: ${response.status}`,
          provider: "google",
          model: MODEL,
          status: response.status,
          message: errorText.substring(0, 200),
        }),
        {
          status: response.status,
          headers: { 
            ...corsHeaders, 
            "Content-Type": "application/json",
            "X-Function-Revision": REVISION,
            "X-Model": MODEL,
          },
        }
      );
    }

    const data = await response.json();
    const exemplo = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    if (!exemplo) {
      throw new Error("Nenhum exemplo foi gerado pela IA");
    }

    // Salvar exemplo no banco
    const { error: updateError } = await supabase
      .from("DICIONARIO")
      .update({
        exemplo_pratico: exemplo,
        exemplo_pratico_gerado_em: new Date().toISOString(),
      })
      .eq("Palavra", palavra);

    if (updateError) {
      console.error("❌ Erro ao salvar exemplo no banco:", updateError);
    } else {
      console.log("💾 Exemplo prático salvo no banco - próximos requests usarão cache (0 tokens)");
    }

    return new Response(
      JSON.stringify({ exemplo, cached: false }),
      { 
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json",
          "X-Function-Revision": REVISION,
          "X-Model": MODEL,
        } 
      }
    );
  } catch (error) {
    console.error("❌ Erro em gerar-exemplo-pratico:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Erro desconhecido",
        provider: "google",
        model: MODEL,
      }),
      {
        status: 500,
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json",
          "X-Function-Revision": REVISION,
          "X-Model": MODEL,
        },
      }
    );
  }
});
