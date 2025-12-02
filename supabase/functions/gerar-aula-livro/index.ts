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
    const { livro_id } = await req.json();
    
    if (!livro_id) {
      throw new Error('ID do livro é obrigatório');
    }

    console.log('📚 Processando aula V2 para livro:', livro_id);

    const DIREITO_PREMIUM_API_KEY = Deno.env.get('DIREITO_PREMIUM_API_KEY');
    if (!DIREITO_PREMIUM_API_KEY) {
      throw new Error('DIREITO_PREMIUM_API_KEY não configurada');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if lesson already exists
    const { data: existingAula, error: fetchError } = await supabase
      .from('aulas_livros')
      .select('*')
      .eq('livro_id', livro_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingAula && !fetchError) {
      const estrutura = existingAula.estrutura_completa as any;
      
      // Only return if it's V2 structure
      if (estrutura?.versao === 2) {
        console.log('✅ Aula V2 encontrada no cache, retornando...');
        
        await supabase
          .from('aulas_livros')
          .update({ visualizacoes: (existingAula.visualizacoes || 0) + 1 })
          .eq('id', existingAula.id);

        return new Response(JSON.stringify({
          ...estrutura,
          cached: true,
          aulaId: existingAula.id
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } else {
        console.log('⚠️ Aula antiga encontrada (V1), gerando nova V2...');
      }
    }

    // Fetch book data
    const { data: livro, error: livroError } = await supabase
      .from('BIBLIOTECA-ESTUDOS')
      .select('*')
      .eq('id', livro_id)
      .single();

    if (livroError || !livro) {
      console.error('Erro ao buscar livro:', livroError);
      throw new Error('Livro não encontrado');
    }

    console.log('📖 Livro encontrado:', livro.Tema);

    // Fetch related summaries
    const { data: resumos, error: resumosError } = await supabase
      .from('RESUMO')
      .select('*')
      .eq('area', livro['Área'])
      .eq('tema', livro.Tema)
      .order('subtema', { ascending: true });

    if (resumosError) {
      console.error('Erro ao buscar resumos:', resumosError);
    }

    console.log('📋 Resumos encontrados:', resumos?.length || 0);

    // Build content for AI
    let conteudoCompleto = `LIVRO: ${livro.Tema}\nÁREA: ${livro['Área']}\n\n`;
    
    if (livro.Sobre) {
      conteudoCompleto += `SOBRE O LIVRO:\n${livro.Sobre}\n\n`;
    }

    if (resumos && resumos.length > 0) {
      conteudoCompleto += `SUBTEMAS E CONTEÚDOS:\n`;
      resumos.slice(0, 5).forEach((r, i) => {
        conteudoCompleto += `\n--- SUBTEMA ${i + 1}: ${r.subtema} ---\n`;
        if (r.conteudo) conteudoCompleto += `${r.conteudo.substring(0, 800)}\n`;
      });
    }

    console.log('📝 Gerando nova aula V2 para o livro...');

    const prompt = `Você é um professor jurídico especialista. Crie uma aula interativa sobre este livro/tema.

${conteudoCompleto}

Crie uma aula no formato JSON com a estrutura V2 (seções com slides interativos).

REGRAS:
- Crie 3-4 seções baseadas nos subtemas do livro
- CADA seção DEVE ter 7 slides na ordem: texto, termos, explicacao, atencao, exemplo, exemplo, quickcheck
- Seja conciso mas educativo

ESTRUTURA JSON:

{
  "versao": 2,
  "titulo": "${livro.Tema} - Aula Completa",
  "tempoEstimado": "30 min",
  "objetivos": ["Objetivo 1", "Objetivo 2", "Objetivo 3"],
  "secoes": [
    {
      "id": 1,
      "tipo": "caput",
      "trechoOriginal": "Resumo do conceito principal",
      "titulo": "Nome do Subtema",
      "slides": [
        {"tipo": "texto", "titulo": "O conteúdo apresenta...", "conteudo": "Explicação clara"},
        {"tipo": "termos", "titulo": "Termos Importantes", "conteudo": "", "termos": [{"termo": "TERMO", "definicao": "Definição"}]},
        {"tipo": "explicacao", "titulo": "Entendendo", "conteudo": "Explicação geral", "topicos": [{"titulo": "Conceito", "detalhe": "Detalhamento"}]},
        {"tipo": "atencao", "titulo": "Ponto de Atenção", "conteudo": "Observação importante"},
        {"tipo": "exemplo", "titulo": "Exemplo 1", "conteudo": "Exemplo cotidiano", "contexto": "Situação Cotidiana"},
        {"tipo": "exemplo", "titulo": "Exemplo 2", "conteudo": "Caso jurídico", "contexto": "Jurisprudência"},
        {"tipo": "quickcheck", "pergunta": "Pergunta?", "opcoes": ["A", "B", "C", "D"], "resposta": 0, "feedback": "Explicação", "conteudo": ""}
      ]
    }
  ],
  "atividadesFinais": {
    "matching": [{"termo": "Termo", "definicao": "Definição curta"}],
    "flashcards": [{"frente": "Pergunta", "verso": "Resposta", "exemplo": "Ex"}],
    "questoes": [{"question": "?", "options": ["a)", "b)", "c)", "d)"], "correctAnswer": 0, "explicacao": "...", "fonte": ""}]
  },
  "provaFinal": [
    {"question": "?", "options": ["a)", "b)", "c)", "d)", "e)"], "correctAnswer": 0, "explicacao": "...", "tempoLimite": 60}
  ]
}

IMPORTANTE:
- Retorne APENAS o JSON válido, sem markdown
- O slide "termos" deve ter 2-3 termos com definições
- O slide "explicacao" deve ter 2-3 tópicos
- "atividadesFinais" deve ter 4-5 itens em cada array
- "provaFinal" deve ter 5-6 questões`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${DIREITO_PREMIUM_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 30000,
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
      
      try {
        estrutura = JSON.parse(estruturaText);
      } catch (secondError: any) {
        console.error('Segunda tentativa falhou:', secondError.message);
        throw new Error('A IA gerou uma resposta inválida. Tente novamente.');
      }
    }
    
    // Ensure versao is set
    estrutura.versao = 2;
    
    console.log('✅ Estrutura V2 gerada com sucesso:', estrutura.titulo);

    // Save to database
    const { data: savedAula, error: saveError } = await supabase
      .from('aulas_livros')
      .insert({
        livro_id: livro_id,
        tema: livro.Tema,
        area: livro['Área'],
        titulo: estrutura.titulo,
        descricao: livro.Sobre || '',
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

    console.log('💾 Aula V2 salva no banco com ID:', savedAula.id);

    return new Response(JSON.stringify({
      ...estrutura,
      cached: false,
      aulaId: savedAula.id
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
