import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.1";

const REVISION = "v3.0.0-flashcards-artigos-lei-2025";
const MODEL = "gemini-2.0-flash";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  console.log(`📍 Function: gerar-flashcards@${REVISION}`);
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content, tableName, numeroArtigo, area, tipo } = await req.json();

    const DIREITO_PREMIUM_API_KEY = Deno.env.get("DIREITO_PREMIUM_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!DIREITO_PREMIUM_API_KEY) {
      throw new Error("DIREITO_PREMIUM_API_KEY não configurada");
    }
    
    console.log("✅ DIREITO_PREMIUM_API_KEY configurada");
    console.log(`🤖 Usando modelo: ${MODEL}`);
    console.log(`📚 Área: ${area}, Artigo: ${numeroArtigo}`);

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Verificar se já existem flashcards em cache na tabela FLASHCARDS - ARTIGOS LEI
    if (area && numeroArtigo && tipo !== 'chat') {
      const { data: cached } = await supabase
        .from("FLASHCARDS - ARTIGOS LEI")
        .select('*')
        .eq('area', area)
        .eq('tema', parseInt(numeroArtigo));

      if (cached && cached.length > 0) {
        console.log(`✅ Retornando ${cached.length} flashcards do cache - 0 tokens gastos`);
        return new Response(
          JSON.stringify({ 
            flashcards: cached.map(f => ({ front: f.pergunta, back: f.resposta, exemplo: f.exemplo })), 
            cached: true,
            count: cached.length 
          }),
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
    }

    const systemPrompt = `Você é um professor de Direito especializado em criar flashcards de alta qualidade para estudo.

REGRAS IMPORTANTES:
1. Crie entre 20 e 25 flashcards variados sobre o artigo
2. Cada flashcard deve ter:
   - front: Uma pergunta clara e direta sobre o conteúdo
   - back: A resposta completa e educacional
   - exemplo (opcional): Um exemplo prático de aplicação
3. Varie os tipos de perguntas:
   - Conceituais (O que é...?)
   - Práticas (Quando se aplica...?)
   - Comparativas (Qual a diferença entre...?)
   - Casos práticos (Em que situação...?)
   - Penas e sanções (Qual a pena para...?)
   - Requisitos (Quais os requisitos...?)
4. Use linguagem clara e acessível
5. Mantenha fidelidade ao texto da lei seca
6. Retorne APENAS JSON válido, sem markdown`;

    const userPrompt = `Crie entre 20 e 25 flashcards de estudo baseados neste artigo de lei:

${content}

Retorne APENAS um JSON válido no formato:
{
  "flashcards": [
    {"front": "pergunta", "back": "resposta", "exemplo": "exemplo prático (opcional)"},
    ...
  ]
}`;

    console.log("🚀 Gerando flashcards com Gemini...");

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${DIREITO_PREMIUM_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `${systemPrompt}\n\n${userPrompt}`
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 8000,
          }
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Erro da API Gemini:", response.status, errorText);
      return new Response(
        JSON.stringify({
          error: `Erro ao gerar flashcards: ${response.status}`,
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
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    console.log("📝 Resposta bruta recebida, processando...");
    
    // Extract JSON from markdown code blocks if present
    let jsonText = text;
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1];
    }
    
    // Clean up the JSON text
    jsonText = jsonText.trim();
    if (!jsonText.startsWith('{')) {
      const startIndex = jsonText.indexOf('{');
      if (startIndex !== -1) {
        jsonText = jsonText.substring(startIndex);
      }
    }
    
    const parsed = JSON.parse(jsonText);
    const flashcards = parsed.flashcards;

    console.log(`✅ ${flashcards.length} flashcards gerados`);

    // Salvar flashcards na tabela FLASHCARDS - ARTIGOS LEI (cada um como uma linha)
    if (area && numeroArtigo && flashcards && flashcards.length > 0 && tipo !== 'chat') {
      try {
        const flashcardsToInsert = flashcards.map((f: any) => ({
          area: area,
          tema: parseInt(numeroArtigo),
          pergunta: f.front,
          resposta: f.back,
          exemplo: f.exemplo || null,
        }));

        const { error: insertError } = await supabase
          .from("FLASHCARDS - ARTIGOS LEI")
          .insert(flashcardsToInsert);

        if (insertError) {
          console.error(`❌ Erro ao salvar flashcards:`, insertError);
        } else {
          console.log(`💾 ${flashcards.length} flashcards salvos na tabela FLASHCARDS - ARTIGOS LEI`);
          console.log(`📊 Próximos requests para ${area} Art. ${numeroArtigo} usarão cache (0 tokens)`);
        }
      } catch (e) {
        console.error(`❌ Erro ao salvar flashcards:`, e);
      }
    }

    return new Response(
      JSON.stringify({ 
        flashcards: flashcards.map((f: any) => ({ front: f.front, back: f.back, exemplo: f.exemplo })), 
        cached: false,
        count: flashcards.length 
      }),
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
    console.error("❌ Erro em gerar-flashcards:", error);
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
