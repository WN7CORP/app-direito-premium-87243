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

    // Construir prompt rico
    const prompt = `Você é um professor jurídico expert. Crie uma aula COMPLETA, INTERATIVA e MUITO DETALHADA sobre: "${tema}"

${conteudoResumosText ? `
CONTEÚDO BASE PARA A AULA (use como referência principal):
${conteudoResumosText}
` : ''}

ÁREA DO DIREITO: ${area}

A aula deve ter entre 4 e 6 MÓDULOS (dependendo da quantidade de subtemas), cada um com conteúdo RICO e EDUCATIVO.

IMPORTANTE: Cada módulo deve abordar um subtema/aspecto diferente do tema principal. Se houver conteúdo base, use-o para criar módulos específicos para cada subtema encontrado.

ESTRUTURA DE CADA MÓDULO:
1. Nome do módulo (título curto e descritivo)
2. Ícone do módulo (escolha entre: BookOpen, Scale, Gavel, FileText, Users, Building, Shield, Award, Target, Lightbulb)

3. CONTEÚDO TEÓRICO MUITO RICO EM MARKDOWN (800-1200 palavras):
   - Use ## para títulos de seções
   - Use ### para subtítulos
   - Use **negrito** e *itálico* para ênfase
   - Use listas ordenadas (1., 2.) e não ordenadas (-)
   - OBRIGATORIAMENTE inclua 4-5 CARDS ESPECIAIS no formato:
     > ⚠️ **ATENÇÃO**: Ponto crítico importante
     > 💡 **IMPORTANTE**: Conceito-chave fundamental
     > 📌 **DICA PRÁTICA**: Aplicação no mundo real
     > ⚖️ **JURISPRUDÊNCIA**: Caso relevante ou entendimento dos tribunais
   - Organize em seções claras com títulos
   - Seja EXTREMAMENTE detalhado e didático

4. EXEMPLO PRÁTICO DETALHADO:
   - Cenário realista (150-200 palavras)
   - Análise jurídica (200-250 palavras)
   - Solução fundamentada (150-200 palavras)
   
5. QUIZ RÁPIDO DE FIXAÇÃO:
   - 3 questões simples (V/F ou múltipla escolha)
   - Para reforço imediato do aprendizado
   
6. RESUMO EM TÓPICOS:
   - 6-8 pontos-chave do módulo

7. 6 termos-chave para matching (definições máx 80 chars)
8. 8 flashcards completos com exemplos
9. 8 questões de múltipla escolha com explicações detalhadas

Ao final de todos os módulos, crie uma PROVA FINAL com 15 questões desafiadoras cobrindo todos os módulos.

IMPORTANTE: 
- Retorne APENAS JSON puro, sem markdown, sem \`\`\`json
- O campo "teoria" deve conter markdown rico e formatado
- Os cards especiais (>, ⚠️, 💡, 📌, ⚖️) são OBRIGATÓRIOS
- Exemplo prático deve ser realista e aplicável
- Seja MUITO detalhado e abrangente

Formato JSON esperado:
{
  "titulo": "Título Completo da Aula",
  "descricao": "Descrição detalhada do que será aprendido (2-3 frases)",
  "area": "${area}",
  "tempoEstimado": "45-60 min",
  "modulos": [
    {
      "id": 1,
      "nome": "Nome do Módulo",
      "icone": "BookOpen",
      "teoria": "## Conceitos Fundamentais\\n\\nTexto rico em markdown...\\n\\n> ⚠️ **ATENÇÃO**: Ponto crítico...\\n\\n### Aplicação Prática\\n\\nMais conteúdo...",
      "exemploPratico": {
        "cenario": "Descrição do caso real...",
        "analise": "Análise jurídica detalhada...",
        "solucao": "Solução fundamentada..."
      },
      "quizRapido": [
        {
          "question": "Questão simples?",
          "options": ["Verdadeiro", "Falso"],
          "correctAnswer": 0,
          "explicacao": "Breve explicação"
        }
      ],
      "resumo": ["Ponto 1", "Ponto 2", "Ponto 3", "Ponto 4", "Ponto 5", "Ponto 6"],
      "matching": [
        {"termo": "Termo", "definicao": "Definição curta (máx 80 chars)"}
      ],
      "flashcards": [
        {"frente": "Pergunta", "verso": "Resposta completa", "exemplo": "Exemplo prático"}
      ],
      "questoes": [
        {
          "question": "Questão detalhada?",
          "options": ["A", "B", "C", "D"],
          "correctAnswer": 0,
          "explicacao": "Explicação detalhada"
        }
      ]
    }
  ],
  "provaFinal": [
    {
      "question": "Questão desafiadora?",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": 0,
      "explicacao": "Explicação detalhada",
      "tempoLimite": 45
    }
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
            maxOutputTokens: 16000,
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
    
    // Limpar markdown se presente
    estruturaText = estruturaText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const estrutura = JSON.parse(estruturaText);
    
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
