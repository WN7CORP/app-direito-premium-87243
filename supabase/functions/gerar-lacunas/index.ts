import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { conteudo, area, artigo } = await req.json();

    if (!conteudo) {
      return new Response(
        JSON.stringify({ error: "Conteúdo do artigo é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "GEMINI_API_KEY não configurada" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Verificar cache
    if (area && artigo) {
      const { data: cacheData } = await supabase
        .from("COMPLETE_LEI_CACHE")
        .select("*")
        .eq("area", area)
        .eq("artigo", artigo)
        .single();

      if (cacheData) {
        console.log("Retornando do cache");
        return new Response(
          JSON.stringify({
            textoComLacunas: cacheData.texto_com_lacunas,
            palavras: cacheData.palavras,
            lacunas: cacheData.lacunas,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Gerar com IA
    const systemPrompt = `Você é um especialista em direito brasileiro. Sua tarefa é criar exercícios de preenchimento de lacunas para artigos de lei.

REGRAS IMPORTANTES:
1. Identifique entre 4 e 8 palavras-chave importantes do texto
2. Priorize termos jurídicos (reclusão, detenção, multa, doloso, culposo, etc.)
3. Inclua números importantes (prazos, valores, quantidades)
4. Inclua conceitos-chave específicos da matéria
5. NÃO remova artigos (o, a, os, as), preposições ou palavras muito comuns
6. Mantenha o texto legível mesmo com as lacunas
7. Substitua cada palavra removida por exatamente "_____" (5 underscores)

RESPONDA APENAS COM JSON VÁLIDO no formato:
{
  "textoComLacunas": "texto com _____ nas lacunas",
  "palavras": ["palavra1", "palavra2", ...],
  "lacunas": [
    {"posicao": 0, "palavraCorreta": "palavra1"},
    {"posicao": 1, "palavraCorreta": "palavra2"},
    ...
  ]
}

A posição começa em 0 e corresponde à ordem de aparição das lacunas no texto.`;

    const userPrompt = `Crie um exercício de preenchimento de lacunas para o seguinte artigo de lei:

${conteudo}

Retorne APENAS o JSON, sem explicações adicionais.`;

    console.log("Chamando Gemini API...");
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: systemPrompt + "\n\n" + userPrompt }],
            },
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 2048,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Erro Gemini API:", errorText);
      return new Response(
        JSON.stringify({ error: "Erro ao chamar Gemini API" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const geminiData = await response.json();
    let textContent = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    console.log("Resposta Gemini:", textContent);

    // Limpar e extrair JSON
    textContent = textContent.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    
    // Tentar encontrar o JSON no texto
    const jsonMatch = textContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("JSON não encontrado na resposta");
      return new Response(
        JSON.stringify({ error: "Resposta inválida da IA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let exercicioData;
    try {
      exercicioData = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error("Erro ao fazer parse do JSON:", parseError);
      return new Response(
        JSON.stringify({ error: "Erro ao processar resposta da IA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validar estrutura
    if (!exercicioData.textoComLacunas || !exercicioData.palavras || !exercicioData.lacunas) {
      console.error("Estrutura JSON inválida:", exercicioData);
      return new Response(
        JSON.stringify({ error: "Estrutura de resposta inválida" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Salvar no cache
    if (area && artigo) {
      const { error: insertError } = await supabase
        .from("COMPLETE_LEI_CACHE")
        .upsert({
          area,
          artigo,
          texto_com_lacunas: exercicioData.textoComLacunas,
          palavras: exercicioData.palavras,
          lacunas: exercicioData.lacunas,
          created_at: new Date().toISOString(),
        });

      if (insertError) {
        console.error("Erro ao salvar cache:", insertError);
      } else {
        console.log("Salvo no cache com sucesso");
      }
    }

    return new Response(
      JSON.stringify(exercicioData),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Erro na função:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro interno";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
