import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.1";

const REVISION = "v3.2.0-json-repair";
const MODEL = "gemini-2.5-flash";

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

    const systemPrompt = `Você é um professor de Direito especialista em criar flashcards.

REGRAS OBRIGATÓRIAS:
1. Analise TODO o conteúdo do artigo
2. Crie flashcards para CADA conceito/aspecto importante
3. MÍNIMO 10 flashcards, crie quantos forem necessários para cobrir tudo
4. PROIBIDO REPETIR - cada flashcard DEVE ser sobre tema/aspecto DIFERENTE
5. VARIE os tipos de perguntas:
   - Conceito (O que é...?)
   - Requisitos (Quais os requisitos...?)
   - Aplicação (Quando se aplica...?)
   - Exceções (Em que casos não se aplica...?)
   - Prazos (Qual o prazo...?)
   - Penas/Sanções (Qual a consequência...?)
   - Sujeitos (Quem pode...?)
6. EXEMPLO PRÁTICO OBRIGATÓRIO - situação real com nomes fictícios
7. Respostas CONCISAS e diretas
8. Retorne APENAS JSON válido, sem markdown`;

    const userPrompt = `Analise este artigo e crie flashcards para cobrir TODO o conteúdo:

${content}

INSTRUÇÕES:
- Identifique TODOS os conceitos, requisitos, exceções, prazos e regras
- Crie flashcard para CADA aspecto (mínimo 10, sem máximo)
- NÃO REPITA conceitos - cada flashcard único
- EXEMPLO PRÁTICO obrigatório em cada um

JSON formato:
{"flashcards":[{"front":"pergunta","back":"resposta","exemplo":"Ex: Maria fez X, aplica-se Y porque Z."}]}`;

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
            temperature: 0.5,
            maxOutputTokens: 16000,
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
    
    // Tentar reparar JSON truncado
    let parsed;
    try {
      parsed = JSON.parse(jsonText);
    } catch (parseError) {
      console.log("⚠️ JSON truncado, tentando reparar...");
      
      // Encontrar último flashcard completo
      const lastCompleteIndex = jsonText.lastIndexOf('{"front"');
      if (lastCompleteIndex > 0) {
        // Verificar se tem um flashcard completo antes
        const beforeLast = jsonText.substring(0, lastCompleteIndex);
        const lastBraceIndex = beforeLast.lastIndexOf('}');
        if (lastBraceIndex > 0) {
          jsonText = beforeLast.substring(0, lastBraceIndex + 1) + ']}';
          console.log("🔧 JSON reparado, tentando parse novamente...");
          try {
            parsed = JSON.parse(jsonText);
          } catch {
            // Fallback: extrair flashcards individualmente com regex
            console.log("🔧 Tentando extração por regex...");
            const flashcardRegex = /\{"front"\s*:\s*"([^"]+)"\s*,\s*"back"\s*:\s*"([^"]+)"\s*,\s*"exemplo"\s*:\s*"([^"]+)"\s*\}/g;
            const matches = [...jsonText.matchAll(flashcardRegex)];
            if (matches.length > 0) {
              parsed = {
                flashcards: matches.map(m => ({ front: m[1], back: m[2], exemplo: m[3] }))
              };
              console.log(`✅ Extraídos ${matches.length} flashcards via regex`);
            } else {
              throw new Error("Não foi possível extrair flashcards do JSON");
            }
          }
        } else {
          throw parseError;
        }
      } else {
        throw parseError;
      }
    }
    
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
