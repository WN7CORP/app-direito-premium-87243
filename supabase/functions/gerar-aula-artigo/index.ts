import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { codigoTabela, numeroArtigo, conteudoArtigo } = await req.json();
    
    if (!codigoTabela || !numeroArtigo || !conteudoArtigo) {
      throw new Error('Código da tabela, número do artigo e conteúdo são obrigatórios');
    }

    const DIREITO_PREMIUM_API_KEY = Deno.env.get('DIREITO_PREMIUM_API_KEY');
    if (!DIREITO_PREMIUM_API_KEY) {
      throw new Error('DIREITO_PREMIUM_API_KEY não configurada');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🔍 Verificando se já existe aula para:', codigoTabela, numeroArtigo);

    // Check if lesson already exists
    const { data: existingAula, error: fetchError } = await supabase
      .from('aulas_artigos')
      .select('*')
      .eq('codigo_tabela', codigoTabela)
      .eq('numero_artigo', numeroArtigo)
      .single();

    if (existingAula && !fetchError) {
      console.log('✅ Aula encontrada no cache, retornando...');
      
      await supabase
        .from('aulas_artigos')
        .update({ visualizacoes: (existingAula.visualizacoes || 0) + 1 })
        .eq('id', existingAula.id);

      return new Response(JSON.stringify({
        ...existingAula.estrutura_completa,
        cached: true,
        aulaId: existingAula.id
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('📝 Gerando nova aula V2 APRIMORADA para o artigo...');

    const prompt = `Você é um professor jurídico especialista. Crie uma aula interativa COMPLETA e DETALHADA sobre este artigo de lei.

CÓDIGO: ${codigoTabela}
ARTIGO: ${numeroArtigo}
TEXTO COMPLETO DO ARTIGO:
${conteudoArtigo}

INSTRUÇÕES IMPORTANTES:
1. Analise CADA PARTE do artigo (caput, incisos, parágrafos, alíneas)
2. Para cada parte, crie uma seção com slides interativos DETALHADOS
3. Cada seção DEVE ter a seguinte sequência de slides:
   - texto: O que diz o artigo
   - termos: Termos jurídicos importantes com definições
   - explicacao: Explicação detalhada com tópicos
   - atencao: Ponto de atenção importante
   - exemplo 1: Exemplo prático do cotidiano
   - exemplo 2: Exemplo de jurisprudência ou caso complexo
   - quickcheck: Verificação rápida

ESTRUTURA JSON A RETORNAR:

{
  "versao": 2,
  "titulo": "Art. ${numeroArtigo} - [Título descritivo do tema]",
  "tempoEstimado": "[X] min",
  "objetivos": [
    "Objetivo 1: O que o aluno vai aprender",
    "Objetivo 2: Habilidade que vai desenvolver",
    "Objetivo 3: Aplicação prática"
  ],
  "secoes": [
    {
      "id": 1,
      "tipo": "caput",
      "trechoOriginal": "[Texto exato dessa parte do artigo]",
      "titulo": "[Título resumido desta seção]",
      "slides": [
        {
          "tipo": "texto",
          "titulo": "O texto diz...",
          "conteudo": "[Destaque e explique o texto legal de forma clara]"
        },
        {
          "tipo": "termos",
          "titulo": "Termos Importantes",
          "conteudo": "",
          "termos": [
            {"termo": "TERMO 1", "definicao": "Definição clara e objetiva do termo jurídico"},
            {"termo": "TERMO 2", "definicao": "Definição clara e objetiva"},
            {"termo": "TERMO 3", "definicao": "Definição clara e objetiva"}
          ]
        },
        {
          "tipo": "explicacao",
          "titulo": "Entendendo o Artigo",
          "conteudo": "[Explicação geral introdutória]",
          "topicos": [
            {"titulo": "Natureza Jurídica", "detalhe": "Explicação detalhada sobre a natureza jurídica deste dispositivo"},
            {"titulo": "Elementos Essenciais", "detalhe": "Quais são os requisitos e elementos necessários"},
            {"titulo": "Aplicabilidade", "detalhe": "Quando e como este artigo se aplica na prática"}
          ]
        },
        {
          "tipo": "atencao",
          "titulo": "Ponto de Atenção",
          "conteudo": "[Pegadinhas, exceções, detalhes importantes para provas e prática]"
        },
        {
          "tipo": "exemplo",
          "titulo": "Exemplo Prático 1",
          "conteudo": "[Situação comum do dia-a-dia que ilustra a aplicação do artigo]",
          "contexto": "Situação Cotidiana"
        },
        {
          "tipo": "exemplo",
          "titulo": "Exemplo Prático 2",
          "conteudo": "[Caso de jurisprudência ou situação mais complexa que demonstra a aplicação]",
          "contexto": "Jurisprudência / Caso Complexo"
        },
        {
          "tipo": "quickcheck",
          "pergunta": "[Pergunta rápida de fixação sobre esta seção]",
          "opcoes": ["Opção A", "Opção B", "Opção C", "Opção D"],
          "resposta": 0,
          "feedback": "[Explicação da resposta correta]",
          "conteudo": ""
        }
      ]
    }
  ],
  "atividadesFinais": {
    "matching": [
      {"termo": "Termo jurídico 1", "definicao": "Definição curta (max 60 chars)"},
      {"termo": "Termo jurídico 2", "definicao": "Definição curta"},
      {"termo": "Termo jurídico 3", "definicao": "Definição curta"},
      {"termo": "Termo jurídico 4", "definicao": "Definição curta"}
    ],
    "flashcards": [
      {"frente": "Conceito ou pergunta", "verso": "Resposta ou definição", "exemplo": "Exemplo prático"},
      {"frente": "Conceito 2", "verso": "Resposta 2", "exemplo": "Exemplo 2"},
      {"frente": "Conceito 3", "verso": "Resposta 3", "exemplo": "Exemplo 3"},
      {"frente": "Conceito 4", "verso": "Resposta 4", "exemplo": "Exemplo 4"}
    ],
    "questoes": [
      {
        "question": "Questão estilo concurso 1",
        "options": ["a) Alternativa A", "b) Alternativa B", "c) Alternativa C", "d) Alternativa D"],
        "correctAnswer": 0,
        "explicacao": "Explicação detalhada da resposta",
        "fonte": "Estilo CESPE/FCC"
      },
      {
        "question": "Questão 2",
        "options": ["a)", "b)", "c)", "d)"],
        "correctAnswer": 1,
        "explicacao": "Explicação",
        "fonte": "Estilo OAB"
      },
      {
        "question": "Questão 3",
        "options": ["a)", "b)", "c)", "d)"],
        "correctAnswer": 2,
        "explicacao": "Explicação",
        "fonte": ""
      },
      {
        "question": "Questão 4",
        "options": ["a)", "b)", "c)", "d)"],
        "correctAnswer": 0,
        "explicacao": "Explicação",
        "fonte": ""
      }
    ]
  },
  "provaFinal": [
    {
      "question": "Questão final 1 - mais complexa",
      "options": ["a)", "b)", "c)", "d)", "e)"],
      "correctAnswer": 0,
      "explicacao": "Explicação completa",
      "tempoLimite": 60
    },
    {
      "question": "Questão final 2",
      "options": ["a)", "b)", "c)", "d)", "e)"],
      "correctAnswer": 1,
      "explicacao": "Explicação",
      "tempoLimite": 60
    },
    {
      "question": "Questão final 3",
      "options": ["a)", "b)", "c)", "d)", "e)"],
      "correctAnswer": 2,
      "explicacao": "Explicação",
      "tempoLimite": 60
    },
    {
      "question": "Questão final 4",
      "options": ["a)", "b)", "c)", "d)", "e)"],
      "correctAnswer": 3,
      "explicacao": "Explicação",
      "tempoLimite": 60
    },
    {
      "question": "Questão final 5",
      "options": ["a)", "b)", "c)", "d)", "e)"],
      "correctAnswer": 0,
      "explicacao": "Explicação",
      "tempoLimite": 60
    },
    {
      "question": "Questão final 6",
      "options": ["a)", "b)", "c)", "d)", "e)"],
      "correctAnswer": 1,
      "explicacao": "Explicação",
      "tempoLimite": 60
    }
  ]
}

REGRAS IMPORTANTES:
- Crie 2-4 seções dependendo da complexidade do artigo
- CADA seção DEVE ter OBRIGATORIAMENTE 7 slides na ordem: texto, termos, explicacao, atencao, exemplo, exemplo, quickcheck
- O slide "termos" deve ter 2-4 termos jurídicos relevantes com definições claras
- O slide "explicacao" deve ter conteudo geral + 2-3 tópicos detalhados
- DEVE haver DOIS slides "exemplo" por seção: um cotidiano e um de jurisprudência
- Slides tipo "quickcheck" devem ter exatamente 4 opções
- O campo "resposta" é o índice (0-3) da opção correta
- Textos devem ser didáticos, detalhados e focados em concursos
- Retorne APENAS o JSON, sem markdown`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${DIREITO_PREMIUM_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 25000,
            responseMimeType: "application/json",
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
      throw new Error('Resposta vazia da IA');
    }
    
    estruturaText = estruturaText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    let estrutura;
    try {
      estrutura = JSON.parse(estruturaText);
    } catch (parseError: any) {
      console.error('Erro ao parsear JSON, tentando limpeza:', parseError.message);
      
      const startIndex = estruturaText.indexOf('{');
      const endIndex = estruturaText.lastIndexOf('}');
      
      if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
        estruturaText = estruturaText.substring(startIndex, endIndex + 1);
      }
      
      estruturaText = estruturaText
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n');
      
      try {
        estrutura = JSON.parse(estruturaText);
      } catch (secondError: any) {
        console.error('Segunda tentativa falhou:', secondError.message);
        
        let inString = false;
        let escaped = false;
        let result = '';
        
        for (let i = 0; i < estruturaText.length; i++) {
          const char = estruturaText[i];
          
          if (escaped) {
            result += char;
            escaped = false;
            continue;
          }
          
          if (char === '\\' && inString) {
            result += char;
            escaped = true;
            continue;
          }
          
          if (char === '"') {
            inString = !inString;
            result += char;
            continue;
          }
          
          if (inString) {
            if (char === '\n' || char === '\r' || char === '\t') {
              result += ' ';
            } else {
              result += char;
            }
          } else {
            if (!/\s/.test(char)) {
              result += char;
            }
          }
        }
        
        try {
          estrutura = JSON.parse(result);
        } catch (finalError: any) {
          console.error('Falha definitiva no parsing:', finalError.message);
          throw new Error('A IA gerou uma resposta inválida. Tente novamente.');
        }
      }
    }
    
    // Ensure versao is set
    estrutura.versao = 2;
    
    console.log('✅ Estrutura V2 APRIMORADA gerada com sucesso:', estrutura.titulo);

    const { data: savedAula, error: saveError } = await supabase
      .from('aulas_artigos')
      .insert({
        codigo_tabela: codigoTabela,
        numero_artigo: numeroArtigo,
        conteudo_artigo: conteudoArtigo,
        estrutura_completa: estrutura,
        visualizacoes: 1
      })
      .select()
      .single();

    if (saveError) {
      console.error('Erro ao salvar aula:', saveError);
      return new Response(JSON.stringify({
        ...estrutura,
        cached: false
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('💾 Aula V2 APRIMORADA salva no banco com ID:', savedAula.id);

    return new Response(JSON.stringify({
      ...estrutura,
      cached: false,
      aulaId: savedAula.id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Erro em gerar-aula-artigo:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Erro ao gerar aula do artigo' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
