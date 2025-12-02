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

    // Initialize Supabase client
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
      
      // Increment view count
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

    console.log('📝 Gerando nova aula para o artigo...');

    const prompt = `Crie uma aula sobre este artigo de lei:

CÓDIGO: ${codigoTabela}
ARTIGO: ${numeroArtigo}
TEXTO: ${conteudoArtigo}

Gere 3 módulos com esta estrutura para cada:
- nome: título curto
- icone: BookOpen, Scale ou Gavel
- teoria: texto explicativo (300-400 palavras, use markdown)
- exemploPratico: {cenario, analise, solucao} - textos curtos
- quizRapido: 2 questões simples [{question, options, correctAnswer, explicacao}]
- resumo: 4 pontos-chave
- matching: 4 termos [{termo, definicao}] - definição máx 60 chars
- flashcards: 4 cards [{frente, verso, exemplo}]
- questoes: 4 questões [{question, options, correctAnswer, explicacao}]

Ao final, provaFinal com 6 questões [{question, options, correctAnswer, explicacao, tempoLimite: 45}]

Retorne JSON válido com: titulo, descricao, area, modulos[], provaFinal[]`;

    const systemPrompt = 'Você é um professor jurídico expert que cria aulas estruturadas e didáticas focadas em artigos específicos de lei. Sempre retorne APENAS JSON puro válido, sem markdown, sem ```json.';
    const fullPrompt = `${systemPrompt}\n\n${prompt}`;

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
              text: fullPrompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 16000,
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
    
    // Clean markdown if present
    estruturaText = estruturaText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    let estrutura;
    try {
      estrutura = JSON.parse(estruturaText);
    } catch (parseError: any) {
      console.error('Erro ao parsear JSON, tentando limpeza:', parseError.message);
      
      // Try to find JSON object boundaries
      const startIndex = estruturaText.indexOf('{');
      const endIndex = estruturaText.lastIndexOf('}');
      
      if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
        estruturaText = estruturaText.substring(startIndex, endIndex + 1);
      }
      
      // Remove problematic characters while preserving JSON structure
      estruturaText = estruturaText
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control chars except \t \n \r
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n');
      
      try {
        estrutura = JSON.parse(estruturaText);
      } catch (secondError: any) {
        console.error('Segunda tentativa falhou:', secondError.message);
        
        // Final attempt: minify JSON by removing all whitespace outside strings
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
            // Replace newlines inside strings with space
            if (char === '\n' || char === '\r' || char === '\t') {
              result += ' ';
            } else {
              result += char;
            }
          } else {
            // Outside strings, skip whitespace
            if (!/\s/.test(char)) {
              result += char;
            }
          }
        }
        
        try {
          estrutura = JSON.parse(result);
        } catch (finalError: any) {
          console.error('Falha definitiva no parsing:', finalError.message);
          console.error('Texto original (primeiros 300 chars):', estruturaText.substring(0, 300));
          throw new Error('A IA gerou uma resposta inválida. Tente novamente.');
        }
      }
    }
    
    console.log('✅ Estrutura gerada com sucesso:', estrutura.titulo);

    // Save to database
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
      // Return anyway even if save fails
      return new Response(JSON.stringify({
        ...estrutura,
        cached: false
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('💾 Aula salva no banco com ID:', savedAula.id);

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
