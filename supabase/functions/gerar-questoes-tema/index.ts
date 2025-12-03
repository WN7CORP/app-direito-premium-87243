import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { area, tema, resumos } = await req.json();

    if (!area || !tema || !resumos || resumos.length === 0) {
      throw new Error('área, tema e resumos são obrigatórios');
    }

    console.log(`Gerando questões para ${area} > ${tema} (${resumos.length} resumos)`);

    // Inicializar Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verificar se já existem questões para este tema
    const { data: existingData, count } = await supabase
      .from('QUESTOES_GERADAS')
      .select('*', { count: 'exact', head: true })
      .eq('area', area)
      .eq('tema', tema);

    // Se já existe, retornar as questões existentes
    if (count && count > 0) {
      console.log(`${count} questões já existem no cache. Retornando...`);
      const { data: questoesExistentes } = await supabase
        .from('QUESTOES_GERADAS')
        .select('*')
        .eq('area', area)
        .eq('tema', tema)
        .eq('aprovada', true);

      return new Response(
        JSON.stringify({ 
          questoes_geradas: count,
          questoes: questoesExistentes,
          fromCache: true 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Gerar novas questões com Gemini Premium
    const DIREITO_PREMIUM_API_KEY = Deno.env.get('DIREITO_PREMIUM_API_KEY');
    if (!DIREITO_PREMIUM_API_KEY) {
      throw new Error('DIREITO_PREMIUM_API_KEY não configurada');
    }

    // Agrupar resumos por subtema
    const resumosPorSubtema = resumos.reduce((acc: any, resumo: any) => {
      const subtema = resumo.subtema || resumo.tema;
      if (!acc[subtema]) {
        acc[subtema] = [];
      }
      acc[subtema].push(resumo);
      return acc;
    }, {});

    const subtemas = Object.keys(resumosPorSubtema);
    const totalQuestoesEsperadas = subtemas.length * 10;
    
    console.log(`\n📚 ${subtemas.length} subtemas encontrados para ${area} > ${tema}`);
    console.log(`🎯 Serão geradas ${totalQuestoesEsperadas} questões (10 por subtema)`);

    const todasQuestoes: any[] = [];

    // Processar cada subtema (gerar 10 questões por subtema)
    for (let i = 0; i < subtemas.length; i++) {
      const subtema = subtemas[i];
      const resumosDoSubtema = resumosPorSubtema[subtema];
      
      console.log(`\n🎯 Processando subtema ${i+1}/${subtemas.length}: ${subtema}`);
      console.log(`   ${resumosDoSubtema.length} resumo(s) neste subtema`);

      // Combinar conteúdo de todos os resumos do subtema
      const conteudoCombinado = resumosDoSubtema
        .map((r: any) => r.conteudo)
        .join('\n\n---\n\n');

      const prompt = `Você é um professor experiente de Direito criando questões de múltipla escolha para estudantes de graduação.

📚 CONTEXTO DO CONTEÚDO:
Área: ${area}
Tema: ${tema}
Subtema: ${subtema}

📖 MATERIAL BASE PARA AS QUESTÕES:
${conteudoCombinado}

🎯 TAREFA: Criar EXATAMENTE 10 questões de múltipla escolha sobre o subtema "${subtema}" baseadas EXCLUSIVAMENTE no conteúdo acima.

✅ REGRAS OBRIGATÓRIAS:
1. SEMPRE gerar exatamente 10 questões (nunca menos!)
2. Cada questão TEM QUE TER 4 alternativas: A, B, C, D
3. APENAS 1 alternativa correta por questão
4. Enunciado claro, direto e objetivo (máximo 200 caracteres)
5. Alternativas com tamanho similar (evitar alternativa muito curta/longa)
6. Comentário explicativo OBRIGATÓRIO (2-3 frases didáticas)
7. Exemplo prático OBRIGATÓRIO (história curta ilustrando o conceito)
8. Nível de dificuldade: graduação em direito
9. Baseado APENAS no conteúdo fornecido (não invente informações)

📝 FORMATO DO COMENTÁRIO:
O comentário deve:
- Explicar POR QUE a alternativa correta está certa
- Mencionar conceito-chave ou artigo legal relevante quando aplicável
- Ser didático e ajudar o aluno a aprender o conceito

📖 FORMATO DO EXEMPLO PRÁTICO:
O exemplo_pratico deve:
- Ser uma HISTÓRIA CURTA e REAL ilustrando o conceito
- Usar nomes fictícios (João, Maria, Carlos, etc.)
- Mostrar uma situação prática do dia-a-dia jurídico
- Ter 3-5 frases explicando como o conceito se aplica
- Ajudar o aluno a visualizar o conceito na prática

EXEMPLO de exemplo_pratico bom:
"João alugou um apartamento para Maria por R$ 2.000/mês. Após 4 meses sem pagar, João quer despejar Maria. Neste caso, João (locador) tem legitimidade ativa para propor ação de despejo. Maria (locatária) será citada como ré. O juiz poderá conceder liminar de desocupação em 15 dias se João prestar caução equivalente a 3 meses de aluguel."

❌ NÃO RETORNE NADA ALÉM DO JSON!
❌ NÃO adicione texto antes ou depois do JSON!
❌ NÃO use markdown, formatação ou blocos de código!

✅ RETORNE APENAS ESTE FORMATO JSON:
{
  "questoes": [
    {
      "enunciado": "Pergunta clara e objetiva sobre o tema?",
      "alternativa_a": "Primeira opção de resposta",
      "alternativa_b": "Segunda opção de resposta",
      "alternativa_c": "Terceira opção de resposta",
      "alternativa_d": "Quarta opção de resposta",
      "resposta_correta": "A",
      "comentario": "Explicação didática: a alternativa A está correta porque [conceito]. Segundo [artigo/doutrina], [explicação complementar].",
      "exemplo_pratico": "História curta ilustrando: João é advogado e recebeu um caso onde... [situação prática que demonstra o conceito da questão]."
    }
  ]
}

⚠️ IMPORTANTE: Gere TODAS AS 10 QUESTÕES no mesmo JSON, cada uma com comentario E exemplo_pratico!`;

      try {
        const aiResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${DIREITO_PREMIUM_API_KEY}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [{ text: prompt }]
                }
              ],
              generationConfig: {
                temperature: 0.8,
                maxOutputTokens: 6000,
              },
            }),
          }
        );

        if (!aiResponse.ok) {
          const errorText = await aiResponse.text();
          console.error(`❌ Erro Gemini API: ${aiResponse.status} - ${errorText}`);
          console.error(`Subtema: ${subtema}`);
          // Continuar para próximo subtema ao invés de falhar tudo
          continue;
        }

        const aiData = await aiResponse.json();
        const textoResposta = aiData.candidates?.[0]?.content?.parts?.[0]?.text || '';
        
        // Extrair JSON da resposta
        const jsonMatch = textoResposta.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          console.error('❌ Resposta não contém JSON válido');
          console.error(`Subtema: ${subtema}`);
          console.error(`Texto recebido: ${textoResposta.substring(0, 200)}...`);
          continue;
        }

        const questoesData = JSON.parse(jsonMatch[0]);
        const questoes = questoesData.questoes || [];
        console.log(`   ✅ ${questoes.length} questões geradas para subtema "${subtema}"`);

        // Adicionar campos com exemplo_pratico
        const questoesComMetadados = questoes.map((q: any) => ({
          area: area,
          tema: tema,
          subtema: subtema,
          enunciado: q.enunciado,
          alternativa_a: q.alternativa_a,
          alternativa_b: q.alternativa_b,
          alternativa_c: q.alternativa_c,
          alternativa_d: q.alternativa_d,
          resposta_correta: q.resposta_correta,
          comentario: q.comentario,
          exemplo_pratico: q.exemplo_pratico || null
        }));

        todasQuestoes.push(...questoesComMetadados);
        
        // Log de progresso
        console.log(`   📊 Progresso: ${todasQuestoes.length}/${totalQuestoesEsperadas} questões geradas (${Math.floor((todasQuestoes.length/totalQuestoesEsperadas)*100)}%)`);

        // Delay entre subtemas para evitar rate limits
        if (i + 1 < subtemas.length) {
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
      } catch (error) {
        console.error(`❌ Erro ao processar subtema "${subtema}":`, error);
        // Continuar para próximo subtema
        continue;
      }
    }

    console.log(`\n✨ TOTAL FINAL: ${todasQuestoes.length}/${totalQuestoesEsperadas} questões geradas para ${area} > ${tema}`);
    console.log('💾 Salvando questões na tabela QUESTOES_GERADAS...');

    // Sanitizar payload para garantir que nenhuma coluna gerada/default seja enviada
    const allowedKeys = [
      'area','tema','subtema','enunciado','alternativa_a','alternativa_b','alternativa_c','alternativa_d','resposta_correta','comentario','exemplo_pratico'
    ];
    const sanitizedQuestoes = todasQuestoes.map((q) => {
      const o: any = {};
      for (const k of allowedKeys) o[k] = (q as any)[k];
      return o;
    });

    if (sanitizedQuestoes.length > 0) {
      console.log('🔎 Campos do insert:', Object.keys(sanitizedQuestoes[0]));
    }

    // Salvar questões no banco
    const { error: insertError } = await supabase
      .from('QUESTOES_GERADAS')
      .insert(sanitizedQuestoes);

    if (insertError) {
      console.error('Erro ao salvar questões:', insertError);
      throw insertError;
    }

    console.log('Questões salvas com sucesso!');

    return new Response(
      JSON.stringify({ 
        questoes_geradas: todasQuestoes.length,
        questoes: todasQuestoes,
        fromCache: false 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Erro em gerar-questoes-tema:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
