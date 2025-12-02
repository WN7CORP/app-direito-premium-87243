import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { livro_id } = await req.json();
    
    if (!livro_id) {
      throw new Error('livro_id é obrigatório');
    }

    const DIREITO_PREMIUM_API_KEY = Deno.env.get('DIREITO_PREMIUM_API_KEY');
    if (!DIREITO_PREMIUM_API_KEY) {
      throw new Error('DIREITO_PREMIUM_API_KEY não configurada');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Buscando dados do livro:', livro_id);

    // Buscar dados do livro
    const { data: livro, error: livroError } = await supabase
      .from('BIBLIOTECA-ESTUDOS')
      .select('*')
      .eq('id', livro_id)
      .single();

    if (livroError || !livro) {
      throw new Error('Livro não encontrado');
    }

    const tema = livro.Tema || '';
    const area = livro['Área'] || 'Direito';

    console.log('Livro encontrado:', tema);

    // Buscar resumos relacionados ao tema
    const { data: resumos, error: resumosError } = await supabase
      .from('RESUMO')
      .select('tema, conteudo, subtema')
      .or(`tema.ilike.%${tema}%,subtema.ilike.%${tema}%`)
      .limit(10);

    let conteudoResumosText = '';
    if (resumos && resumos.length > 0) {
      console.log(`Encontrados ${resumos.length} resumos relacionados`);
      conteudoResumosText = resumos.map(r => 
        `### ${r.subtema || r.tema}\n${r.conteudo || ''}`
      ).join('\n\n---\n\n');
    } else {
      console.log('Nenhum resumo encontrado, usando apenas título do livro');
    }

    // Construir prompt SIMPLIFICADO para evitar truncamento
    const prompt = `Você é um professor jurídico expert. Crie uma aula COMPLETA sobre: "${tema}"

${conteudoResumosText ? `
CONTEÚDO BASE:
${conteudoResumosText.substring(0, 4000)}
` : ''}

ÁREA: ${area}

Crie uma aula com 3 MÓDULOS (exatamente 3). Seja conciso mas educativo.

ESTRUTURA EXATA DE CADA MÓDULO:
1. Nome do módulo (título curto)
2. Ícone: BookOpen, Scale, Gavel, FileText, Users ou Shield

3. TEORIA (400-500 palavras em markdown):
   - Use ## para títulos
   - Use listas com -
   - Inclua 2-3 cards: > ⚠️ **ATENÇÃO**: ou > 💡 **IMPORTANTE**:

4. EXEMPLO PRÁTICO:
   - cenario: 80-100 palavras
   - analise: 100-120 palavras
   - solucao: 80-100 palavras

5. QUIZ RÁPIDO: 2 questões V/F

6. RESUMO: 4 pontos-chave

7. MATCHING: 4 termos com definições (máx 60 chars cada)

8. FLASHCARDS: 4 cards (frente, verso, exemplo curto)

9. QUESTÕES: 4 múltipla escolha com explicação curta

PROVA FINAL: 8 questões cobrindo todos os módulos.

Retorne SOMENTE o JSON abaixo, sem texto adicional:

{
  "titulo": "Título da Aula",
  "descricao": "Descrição em 1 frase",
  "area": "${area}",
  "tempoEstimado": "30-45 min",
  "modulos": [
    {
      "id": 1,
      "nome": "Nome",
      "icone": "BookOpen",
      "teoria": "## Título\\n\\nTexto...\\n\\n> ⚠️ **ATENÇÃO**: Ponto...",
      "exemploPratico": {
        "cenario": "...",
        "analise": "...",
        "solucao": "..."
      },
      "quizRapido": [
        {"question": "?", "options": ["V", "F"], "correctAnswer": 0, "explicacao": "..."}
      ],
      "resumo": ["1", "2", "3", "4"],
      "matching": [
        {"termo": "Termo", "definicao": "Def curta"}
      ],
      "flashcards": [
        {"frente": "?", "verso": "Resp", "exemplo": "Ex"}
      ],
      "questoes": [
        {"question": "?", "options": ["A", "B", "C", "D"], "correctAnswer": 0, "explicacao": "..."}
      ]
    }
  ],
  "provaFinal": [
    {"question": "?", "options": ["A", "B", "C", "D"], "correctAnswer": 0, "explicacao": "...", "tempoLimite": 45}
  ]
}`;

    console.log('Enviando prompt para Gemini...');

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${DIREITO_PREMIUM_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 65536,
            responseMimeType: "application/json"
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro na API Gemini:', response.status, errorText);
      throw new Error('Erro ao gerar estrutura da aula');
    }

    const data = await response.json();
    let estruturaText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!estruturaText) {
      console.error('Resposta vazia da Gemini:', JSON.stringify(data));
      throw new Error('A IA não retornou conteúdo');
    }

    console.log('Tamanho da resposta:', estruturaText.length);
    
    // Limpar markdown se presente
    estruturaText = estruturaText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    let estrutura;
    try {
      estrutura = JSON.parse(estruturaText);
    } catch (parseError) {
      console.error('Erro no parse JSON inicial, tentando corrigir...');
      console.error('Primeiros 500 chars:', estruturaText.substring(0, 500));
      console.error('Últimos 500 chars:', estruturaText.substring(estruturaText.length - 500));
      
      // Tentar encontrar JSON válido
      try {
        // Encontrar o último } que fecha o objeto principal
        let depth = 0;
        let lastValidEnd = -1;
        for (let i = 0; i < estruturaText.length; i++) {
          if (estruturaText[i] === '{') depth++;
          if (estruturaText[i] === '}') {
            depth--;
            if (depth === 0) {
              lastValidEnd = i;
            }
          }
        }
        
        if (lastValidEnd > 0) {
          const fixedJson = estruturaText.substring(0, lastValidEnd + 1);
          estrutura = JSON.parse(fixedJson);
          console.log('JSON corrigido com sucesso');
        } else {
          throw new Error('Não foi possível encontrar JSON válido');
        }
      } catch (fixError) {
        console.error('Falha ao corrigir JSON:', fixError);
        throw new Error('A IA gerou uma resposta incompleta. Tente novamente.');
      }
    }
    
    console.log('Estrutura gerada com sucesso:', estrutura.titulo, '- Módulos:', estrutura.modulos?.length);

    // Salvar no banco
    const { data: aulaSalva, error: saveError } = await supabase
      .from('aulas_livros')
      .insert({
        livro_id: livro_id,
        tema: tema,
        area: area,
        titulo: estrutura.titulo,
        descricao: estrutura.descricao,
        estrutura_completa: estrutura
      })
      .select()
      .single();

    if (saveError) {
      console.error('Erro ao salvar aula:', saveError);
      // Retorna a estrutura mesmo sem salvar
      return new Response(JSON.stringify({ estrutura, saved: false }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Aula salva com ID:', aulaSalva.id);

    return new Response(JSON.stringify({ 
      estrutura, 
      aulaId: aulaSalva.id,
      saved: true 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Erro em gerar-aula-livro:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Erro ao gerar aula do livro' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
