import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Configuração: máximo de subtemas por chamada para evitar timeout
const MAX_SUBTEMAS_POR_CHAMADA = 5;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { area, tema, resumos } = await req.json();

    if (!area || !tema || !resumos || resumos.length === 0) {
      throw new Error('área, tema e resumos são obrigatórios');
    }

    console.log(`\n📚 Iniciando geração progressiva para ${area} > ${tema}`);
    console.log(`📝 ${resumos.length} resumos recebidos`);

    // Inicializar Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Agrupar resumos por subtema
    const resumosPorSubtema = resumos.reduce((acc: any, resumo: any) => {
      const subtema = resumo.subtema || resumo.tema;
      if (!acc[subtema]) {
        acc[subtema] = [];
      }
      acc[subtema].push(resumo);
      return acc;
    }, {});

    const todosSubtemas = Object.keys(resumosPorSubtema);
    const totalSubtemas = todosSubtemas.length;
    
    console.log(`📊 Total de subtemas no tema: ${totalSubtemas}`);

    // 1. Verificar quais subtemas JÁ têm questões geradas
    const { data: subtemasExistentes } = await supabase
      .from('QUESTOES_GERADAS')
      .select('subtema')
      .eq('area', area)
      .eq('tema', tema);

    const subtemasJaProcessados = new Set(
      (subtemasExistentes || []).map((r: any) => r.subtema)
    );
    
    console.log(`✅ Subtemas já processados: ${subtemasJaProcessados.size}/${totalSubtemas}`);

    // 2. Filtrar subtemas que ainda faltam processar
    const subtemasPendentes = todosSubtemas.filter(
      subtema => !subtemasJaProcessados.has(subtema)
    );
    
    console.log(`⏳ Subtemas pendentes: ${subtemasPendentes.length}`);

    // 3. Buscar questões já existentes
    const { data: questoesExistentes } = await supabase
      .from('QUESTOES_GERADAS')
      .select('*')
      .eq('area', area)
      .eq('tema', tema)
      .eq('aprovada', true);

    const questoesAtuais = questoesExistentes || [];

    // 4. Se TODOS os subtemas já foram processados, retornar do cache
    if (subtemasPendentes.length === 0) {
      console.log(`🎉 Todos os ${totalSubtemas} subtemas já processados! Retornando cache.`);
      
      return new Response(
        JSON.stringify({ 
          questoes: questoesAtuais,
          questoes_geradas: questoesAtuais.length,
          total_subtemas: totalSubtemas,
          subtemas_processados: totalSubtemas,
          geracao_completa: true,
          subtemas_faltantes: 0,
          fromCache: true 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 5. Limitar a MAX_SUBTEMAS_POR_CHAMADA para evitar timeout
    const subtemasParaProcessar = subtemasPendentes.slice(0, MAX_SUBTEMAS_POR_CHAMADA);
    
    console.log(`\n🎯 Processando ${subtemasParaProcessar.length} subtemas nesta chamada:`);
    subtemasParaProcessar.forEach((s, i) => console.log(`   ${i+1}. ${s}`));

    // Configurar API
    const DIREITO_PREMIUM_API_KEY = Deno.env.get('DIREITO_PREMIUM_API_KEY');
    if (!DIREITO_PREMIUM_API_KEY) {
      throw new Error('DIREITO_PREMIUM_API_KEY não configurada');
    }

    const questoesGeradasNestaChamada: any[] = [];
    const allowedKeys = [
      'area','tema','subtema','enunciado','alternativa_a','alternativa_b','alternativa_c','alternativa_d','resposta_correta','comentario','exemplo_pratico'
    ];

    // 6. Processar cada subtema E SALVAR IMEDIATAMENTE
    for (let i = 0; i < subtemasParaProcessar.length; i++) {
      const subtema = subtemasParaProcessar[i];
      const resumosDoSubtema = resumosPorSubtema[subtema];
      
      console.log(`\n🔄 [${i+1}/${subtemasParaProcessar.length}] Processando: "${subtema}"`);

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
              contents: [{ parts: [{ text: prompt }] }],
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
          continue;
        }

        const aiData = await aiResponse.json();
        const textoResposta = aiData.candidates?.[0]?.content?.parts?.[0]?.text || '';
        
        const jsonMatch = textoResposta.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          console.error(`❌ Resposta inválida para subtema "${subtema}"`);
          continue;
        }

        const questoesData = JSON.parse(jsonMatch[0]);
        const questoes = questoesData.questoes || [];
        
        console.log(`   ✅ ${questoes.length} questões geradas`);

        // Preparar questões com metadados
        const questoesComMetadados = questoes.map((q: any) => {
          const o: any = {};
          o.area = area;
          o.tema = tema;
          o.subtema = subtema;
          o.enunciado = q.enunciado;
          o.alternativa_a = q.alternativa_a;
          o.alternativa_b = q.alternativa_b;
          o.alternativa_c = q.alternativa_c;
          o.alternativa_d = q.alternativa_d;
          o.resposta_correta = q.resposta_correta;
          o.comentario = q.comentario;
          o.exemplo_pratico = q.exemplo_pratico || null;
          return o;
        });

        // ⚡ SALVAR IMEDIATAMENTE após cada subtema (não esperar o final!)
        if (questoesComMetadados.length > 0) {
          console.log(`   💾 Salvando ${questoesComMetadados.length} questões...`);
          
          const { error: insertError } = await supabase
            .from('QUESTOES_GERADAS')
            .insert(questoesComMetadados);

          if (insertError) {
            console.error(`   ❌ Erro ao salvar: ${insertError.message}`);
          } else {
            console.log(`   ✅ Questões salvas com sucesso!`);
            questoesGeradasNestaChamada.push(...questoesComMetadados);
          }
        }

        // Delay entre subtemas
        if (i + 1 < subtemasParaProcessar.length) {
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
      } catch (error) {
        console.error(`❌ Erro ao processar subtema "${subtema}":`, error);
        continue;
      }
    }

    // 7. Calcular status final
    const subtemasProcessadosAgora = subtemasJaProcessados.size + subtemasParaProcessar.length;
    const subtemasFaltantes = totalSubtemas - subtemasProcessadosAgora;
    const geracaoCompleta = subtemasFaltantes <= 0;

    // 8. Buscar TODAS as questões atualizadas (existentes + novas)
    const { data: todasQuestoes } = await supabase
      .from('QUESTOES_GERADAS')
      .select('*')
      .eq('area', area)
      .eq('tema', tema)
      .eq('aprovada', true);

    const questoesFinais = todasQuestoes || [];

    console.log(`\n📊 RESUMO DA CHAMADA:`);
    console.log(`   - Questões geradas nesta chamada: ${questoesGeradasNestaChamada.length}`);
    console.log(`   - Total de questões disponíveis: ${questoesFinais.length}`);
    console.log(`   - Subtemas processados: ${subtemasProcessadosAgora}/${totalSubtemas}`);
    console.log(`   - Subtemas faltantes: ${subtemasFaltantes}`);
    console.log(`   - Geração completa: ${geracaoCompleta ? 'SIM ✅' : 'NÃO ⏳'}`);

    return new Response(
      JSON.stringify({ 
        questoes: questoesFinais,
        questoes_geradas: questoesGeradasNestaChamada.length,
        total_questoes: questoesFinais.length,
        total_subtemas: totalSubtemas,
        subtemas_processados: subtemasProcessadosAgora,
        subtemas_faltantes: subtemasFaltantes,
        geracao_completa: geracaoCompleta,
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
