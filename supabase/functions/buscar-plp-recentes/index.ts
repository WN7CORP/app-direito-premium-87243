import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CACHE_LIMIT = 100;
const CACHE_VALIDITY_HOURS = 5;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verificar cache (últimas CACHE_VALIDITY_HOURS horas)
    const cacheValidSince = new Date(Date.now() - CACHE_VALIDITY_HOURS * 60 * 60 * 1000).toISOString();
    
    const { data: cacheData, error: cacheError } = await supabase
      .from('cache_plp_recentes')
      .select('*')
      .gte('updated_at', cacheValidSince)
      .order('data_apresentacao', { ascending: false })
      .limit(CACHE_LIMIT);

    // Verificar se o cache é válido (pelo menos 70% com fotos)
    if (!cacheError && cacheData && cacheData.length >= 10) {
      const comFoto = cacheData.filter(p => p.autor_principal_foto).length;
      const percentualComFoto = (comFoto / cacheData.length) * 100;
      
      if (percentualComFoto >= 70) {
        console.log(`✅ Retornando do cache: ${cacheData.length} PLPs (${comFoto} com fotos - ${percentualComFoto.toFixed(0)}%)`);
        return new Response(JSON.stringify({ proposicoes: cacheData, fromCache: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } else {
        console.log(`⚠️ Cache PLP tem poucas fotos (${percentualComFoto.toFixed(0)}%), forçando atualização...`);
      }
    }

    // Verificar progresso no banco
    const dataHoje = new Date().toISOString().split('T')[0];
    
    const { data: progresso } = await supabase
      .from('cache_proposicoes_progresso')
      .select('*')
      .eq('sigla_tipo', 'PLP')
      .eq('data', dataHoje)
      .single();
    
    // Se já finalizou hoje, verificar se realmente tem dados no cache
    if (progresso?.finalizado) {
      const dataInicio = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const { data: cachedData } = await supabase
        .from('cache_plp_recentes')
        .select('*')
        .eq('sigla_tipo', 'PLP')
        .gte('data_apresentacao', dataInicio)
        .order('ordem_cache', { ascending: false });
      
      // Se o cache tem dados, retornar
      if (cachedData && cachedData.length > 0) {
        console.log(`✅ Processamento PLP de hoje já finalizado, retornando ${cachedData.length} PLPs do cache`);
        return new Response(JSON.stringify({ 
          proposicoes: cachedData,
          fromCache: true,
          finalizado: true
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      // Se não tem dados, resetar o progresso e buscar
      console.log('⚠️ Cache PLP vazio mesmo com finalizado=true, resetando progresso...');
      await supabase
        .from('cache_proposicoes_progresso')
        .update({ finalizado: false, ultima_pagina: 0, total_processados: 0 })
        .eq('sigla_tipo', 'PLP')
        .eq('data', dataHoje);
    }
    
    // Inicializar progresso se não existir
    if (!progresso) {
      await supabase
        .from('cache_proposicoes_progresso')
        .insert({
          sigla_tipo: 'PLP',
          data: dataHoje,
          ultima_pagina: 0,
          total_processados: 0,
          finalizado: false
        });
    }
    
    const proximaPagina = (progresso?.ultima_pagina || 0) + 1;
    console.log(`⚡ Buscando página ${proximaPagina} de PLPs do dia...`);

    // Buscar PLPs dos últimos 7 dias
    const dataInicio = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    console.log(`📅 Buscando PLPs apresentados entre ${dataInicio} e ${dataHoje}`);
    
    const plpsResponse = await fetch(
      `https://dadosabertos.camara.leg.br/api/v2/proposicoes?siglaTipo=PLP&dataApresentacaoInicio=${dataInicio}&dataApresentacaoFim=${dataHoje}&ordem=DESC&ordenarPor=id&itens=15&pagina=${proximaPagina}`,
      { headers: { 'Accept': 'application/json' } }
    );

    if (!plpsResponse.ok) {
      throw new Error('Erro ao buscar PLPs da API');
    }

    const plpsData = await plpsResponse.json();
    const proposicoes = plpsData.dados || [];

    console.log(`📦 PLPs encontrados: ${proposicoes.length}`);
    
    // Se não houver mais proposições, marcar como finalizado
    if (proposicoes.length === 0) {
      await supabase
        .from('cache_proposicoes_progresso')
        .update({ finalizado: true })
        .eq('sigla_tipo', 'PLP')
        .eq('data', dataHoje);
      
      console.log('✅ Nenhum PLP novo, marcando como finalizado');
      
      const { data: cachedData } = await supabase
        .from('cache_plp_recentes')
        .select('*')
        .eq('sigla_tipo', 'PLP')
        .gte('data_apresentacao', dataHoje)
        .order('ordem_cache', { ascending: false });
      
      return new Response(JSON.stringify({ 
        proposicoes: cachedData || [],
        fromCache: true,
        finalizado: true
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const proposicoesProcessadas = [];
    let ordemCache = Date.now();

    for (const [index, plp] of proposicoes.entries()) {
      try {
        console.log(`🔄 Processando ${index + 1}/${proposicoes.length}: PLP ${plp.numero}/${plp.ano}`);

        // Buscar detalhes da proposição
        const detalhesResponse = await fetch(
          `https://dadosabertos.camara.leg.br/api/v2/proposicoes/${plp.id}`,
          { headers: { 'Accept': 'application/json' } }
        );
        
        if (!detalhesResponse.ok) continue;
        
        const detalhes = await detalhesResponse.json();
        const propData = detalhes.dados;

        // Buscar autores COMPLETOS
        const autoresResponse = await fetch(
          `https://dadosabertos.camara.leg.br/api/v2/proposicoes/${plp.id}/autores`,
          { headers: { 'Accept': 'application/json' } }
        );

        let autoresCompletos = [];
        let autorPrincipal = null;
        let fotoAutor = null;

        if (autoresResponse.ok) {
          const autoresData = await autoresResponse.json();
          autoresCompletos = autoresData.dados || [];
          
          // Pegar primeiro autor do tipo "Autor"
          autorPrincipal = autoresCompletos.find((a: any) => a.tipo === 'Autor') || autoresCompletos[0];
          
          if (autorPrincipal) {
            // Extrair ID do deputado
            let deputadoId = null;
            
            if (autorPrincipal.uri) {
              const match = autorPrincipal.uri.match(/\/deputados\/(\d+)/);
              if (match) deputadoId = match[1];
            }
            
            if (!deputadoId && autorPrincipal.uriAutor) {
              const match = autorPrincipal.uriAutor.match(/\/deputados\/(\d+)/);
              if (match) deputadoId = match[1];
            }
            
            if (deputadoId) {
              try {
                // Buscar foto com timeout de 2 segundos
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 2000);
                
                const buscaResponse = await fetch(
                  `https://dadosabertos.camara.leg.br/api/v2/deputados?nome=${encodeURIComponent(autorPrincipal.nome)}&ordem=ASC&ordenarPor=nome`,
                  { 
                    headers: { 'Accept': 'application/json' },
                    signal: controller.signal
                  }
                );
                
                clearTimeout(timeoutId);

                if (buscaResponse.ok) {
                  const buscaData = await buscaResponse.json();
                  if (buscaData.dados && buscaData.dados.length > 0) {
                    fotoAutor = buscaData.dados[0].urlFoto || null;
                  }
                }
              } catch (fotoError) {
                console.error(`⚠️ Timeout ou erro ao buscar foto: ${fotoError}`);
              }
            }
          }
        }

        // Gerar título com IA
        let tituloGerado = null;
        const ementa = propData.ementa || plp.ementa;
        
        if (ementa) {
          try {
            const DIREITO_PREMIUM_API_KEY = Deno.env.get('DIREITO_PREMIUM_API_KEY');
            if (DIREITO_PREMIUM_API_KEY) {
              const aiResponse = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${DIREITO_PREMIUM_API_KEY}`,
                {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    contents: [{
                      parts: [{
                        text: `Você é um redator de títulos jornalísticos. Com base nesta ementa de lei complementar:\n\n"${ementa}"\n\nCrie um título curto, claro e chamativo (máximo 80 caracteres) que explique de forma simples o que esta lei complementar pretende fazer. Use linguagem acessível. Apenas retorne o título, sem aspas.`
                      }]
                    }],
                    generationConfig: {
                      temperature: 0.7,
                      maxOutputTokens: 100,
                    }
                  })
                }
              );

              if (aiResponse.ok) {
                const aiData = await aiResponse.json();
                tituloGerado = aiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
                console.log(`✨ Título gerado para PLP ${plp.numero}/${plp.ano}: ${tituloGerado}`);
              } else {
                console.error(`❌ Erro ao gerar título IA: ${aiResponse.status}`);
              }
            } else {
              console.warn('⚠️ DIREITO_PREMIUM_API_KEY não configurada');
            }
          } catch (aiError) {
            console.error('Erro ao gerar título:', aiError);
          }
        }

        const quantidadeVotacoes = 0;

        const proposicaoProcessada = {
          id_proposicao: plp.id,
          sigla_tipo: plp.siglaTipo,
          numero: plp.numero,
          ano: plp.ano,
          ementa: ementa,
          titulo_gerado_ia: tituloGerado,
          data_apresentacao: propData.dataApresentacao,
          autor_principal_id: autorPrincipal ? (
            autorPrincipal.uri?.split('/').pop() || 
            autorPrincipal.uriAutor?.split('/').pop()
          ) : null,
          autor_principal_nome: autorPrincipal?.nome,
          autor_principal_foto: fotoAutor,
          autor_principal_partido: autorPrincipal?.siglaPartido,
          autor_principal_uf: autorPrincipal?.siglaUf,
          autores_completos: autoresCompletos,
          status: propData.statusProposicao?.descricaoTramitacao,
          situacao: propData.statusProposicao?.descricaoSituacao,
          tema: propData.tema,
          keywords: propData.keywords || [],
          quantidade_votacoes: quantidadeVotacoes,
          orgao_tramitacao: propData.statusProposicao?.siglaOrgao,
          url_inteiro_teor: propData.urlInteiroTeor,
          ordem_cache: ordemCache - index,
          updated_at: new Date().toISOString()
        };
        
        proposicoesProcessadas.push(proposicaoProcessada);

      } catch (error) {
        console.error(`Erro ao processar PLP ${plp.id}:`, error);
      }
    }

    console.log(`✅ PLPs processados: ${proposicoesProcessadas.length}`);

    // Salvar em lote
    if (proposicoesProcessadas.length > 0) {
      const { error: upsertError } = await supabase
        .from('cache_plp_recentes')
        .upsert(proposicoesProcessadas, { onConflict: 'id_proposicao' });

      if (upsertError) {
        console.error('Erro ao salvar PLPs:', upsertError);
      }
    }

    // Atualizar progresso
    const totalProcessadosAtual = (progresso?.total_processados || 0) + proposicoesProcessadas.length;
    
    await supabase
      .from('cache_proposicoes_progresso')
      .update({
        ultima_pagina: proximaPagina,
        total_processados: totalProcessadosAtual,
        finalizado: proposicoes.length < 5
      })
      .eq('sigla_tipo', 'PLP')
      .eq('data', dataHoje);

    console.log(`💾 Cache PLP atualizado: ${proposicoesProcessadas.length} novos (total hoje: ${totalProcessadosAtual})`);

    // Retornar todas as proposições do dia
    const { data: todasDoDia } = await supabase
      .from('cache_plp_recentes')
      .select('*')
      .eq('sigla_tipo', 'PLP')
      .gte('data_apresentacao', dataHoje)
      .order('ordem_cache', { ascending: false });

    return new Response(JSON.stringify({ 
      proposicoes: todasDoDia || [],
      fromCache: false,
      stats: {
        processados_agora: proposicoesProcessadas.length,
        total_hoje: totalProcessadosAtual,
        pagina: proximaPagina
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Erro geral PLP:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
