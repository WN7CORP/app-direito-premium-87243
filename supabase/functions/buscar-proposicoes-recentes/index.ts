import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CACHE_LIMIT = 100; // Limite máximo de proposições no cache
const CACHE_VALIDITY_HOURS = 5; // Cache válido por 5 horas

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Tentar retornar diretamente do cache com dados completos (com autor e foto)
    const { data: cacheData, error: cacheError } = await supabase
      .from('cache_proposicoes_recentes')
      .select('*')
      .not('autor_principal_nome', 'is', null)
      .not('autor_principal_foto', 'is', null)
      .order('ordem_cache', { ascending: false })
      .limit(CACHE_LIMIT);

    // Se o cache tem dados válidos, retornar (sem exigir percentual de fotos)
    if (!cacheError && cacheData && cacheData.length >= 10) {
      const comFoto = cacheData.filter(p => p.autor_principal_foto).length;
      
      console.log(`✅ Retornando do cache: ${cacheData.length} proposições (${comFoto} com fotos)`);
      return new Response(JSON.stringify({ proposicoes: cacheData, fromCache: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verificar progresso no banco
    const dataHoje = new Date().toISOString().split('T')[0];
    const dataInicio = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const { data: progresso } = await supabase
      .from('cache_proposicoes_progresso')
      .select('*')
      .eq('sigla_tipo', 'PL')
      .eq('data', dataHoje)
      .single();
    
    // Se já finalizou hoje, verificar se realmente tem dados no cache
    if (progresso?.finalizado) {
        const { data: cachedData } = await supabase
          .from('cache_proposicoes_recentes')
          .select('*')
          .not('autor_principal_nome', 'is', null)
          .not('autor_principal_foto', 'is', null)
          .gte('data_apresentacao', dataInicio)
          .order('data_apresentacao', { ascending: false });
      
      // Se o cache tem dados, retornar
      if (cachedData && cachedData.length > 0) {
        console.log(`✅ Processamento de hoje já finalizado, retornando ${cachedData.length} proposições do cache`);
        return new Response(JSON.stringify({ 
          proposicoes: cachedData,
          fromCache: true,
          finalizado: true
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      // Se não tem dados, resetar o progresso e buscar
      console.log('⚠️ Cache vazio mesmo com finalizado=true, resetando progresso...');
      await supabase
        .from('cache_proposicoes_progresso')
        .update({ finalizado: false, ultima_pagina: 0, total_processados: 0 })
        .eq('sigla_tipo', 'PL')
        .eq('data', dataHoje);
    }
    
    // Inicializar progresso se não existir
    if (!progresso) {
      await supabase
        .from('cache_proposicoes_progresso')
        .insert({
          sigla_tipo: 'PL',
          data: dataHoje,
          ultima_pagina: 0,
          total_processados: 0,
          finalizado: false
        });
    }
    
    const proximaPagina = (progresso?.ultima_pagina || 0) + 1;
    console.log(`⚡ Buscando página ${proximaPagina} de PLs do dia...`);
    console.log(`📅 Buscando PLs apresentados entre ${dataInicio} e ${dataHoje}`);
    
    const plsResponse = await fetch(
      `https://dadosabertos.camara.leg.br/api/v2/proposicoes?siglaTipo=PL&dataApresentacaoInicio=${dataInicio}&dataApresentacaoFim=${dataHoje}&ordem=DESC&ordenarPor=id&itens=20&pagina=${proximaPagina}`,
      { headers: { 'Accept': 'application/json' } }
    );

    if (!plsResponse.ok) {
      throw new Error('Erro ao buscar proposições da API');
    }

    const plsData = await plsResponse.json();
    const proposicoes = plsData.dados || [];

    console.log(`📦 Proposições encontradas: ${proposicoes.length}`);
    
    // Se não houver mais proposições, marcar como finalizado
    if (proposicoes.length === 0) {
      await supabase
        .from('cache_proposicoes_progresso')
        .update({ finalizado: true })
        .eq('sigla_tipo', 'PL')
        .eq('data', dataHoje);
      
      console.log('✅ Nenhuma proposição nova, marcando como finalizado');
      
      const { data: cachedData } = await supabase
        .from('cache_proposicoes_recentes')
        .select('*')
        .gte('data_apresentacao', dataInicio)
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
    let ordemCache = Date.now(); // Usar timestamp como ordem

    for (const [index, pl] of proposicoes.entries()) {
      try {
        console.log(`🔄 Processando ${index + 1}/${proposicoes.length}: PL ${pl.numero}/${pl.ano}`);

        // Buscar detalhes da proposição
        const detalhesResponse = await fetch(
          `https://dadosabertos.camara.leg.br/api/v2/proposicoes/${pl.id}`,
          { headers: { 'Accept': 'application/json' } }
        );
        
        if (!detalhesResponse.ok) continue;
        
        const detalhes = await detalhesResponse.json();
        const propData = detalhes.dados;

        // Buscar autores COMPLETOS
        const autoresResponse = await fetch(
          `https://dadosabertos.camara.leg.br/api/v2/proposicoes/${pl.id}/autores`,
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
          
          if (autorPrincipal && autorPrincipal.nome) {
            try {
              // Estratégia 1: Buscar pelo nome do deputado (mais confiável)
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 3000);
              
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
                  const deputado = buscaData.dados[0];
                  fotoAutor = deputado.urlFoto || null;
                  console.log(`✅ Foto encontrada para ${autorPrincipal.nome}: ${fotoAutor ? 'SIM' : 'NÃO'}`);
                }
              }
              
              // Estratégia 2: Se não encontrou foto, tentar buscar pelo ID se disponível
              if (!fotoAutor) {
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
                    const detalhesDeputadoResponse = await fetch(
                      `https://dadosabertos.camara.leg.br/api/v2/deputados/${deputadoId}`,
                      { headers: { 'Accept': 'application/json' } }
                    );
                    
                    if (detalhesDeputadoResponse.ok) {
                      const detalhesDeputado = await detalhesDeputadoResponse.json();
                      fotoAutor = detalhesDeputado.dados?.ultimoStatus?.urlFoto || null;
                      console.log(`✅ Foto encontrada via ID ${deputadoId}: ${fotoAutor ? 'SIM' : 'NÃO'}`);
                    }
                  } catch (idError) {
                    console.error(`⚠️ Erro ao buscar foto por ID: ${idError}`);
                  }
                }
              }
            } catch (fotoError) {
              console.error(`⚠️ Erro ao buscar foto de ${autorPrincipal.nome}: ${fotoError}`);
            }
          }
        }

        // Gerar título com IA
        let tituloGerado = null;
        const ementa = propData.ementa || pl.ementa;
        
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
                        text: `Você é um redator de títulos jornalísticos. Com base nesta ementa de projeto de lei:\n\n"${ementa}"\n\nCrie um título curto, claro e chamativo (máximo 80 caracteres) que explique de forma simples o que este projeto de lei pretende fazer. Use linguagem acessível. Apenas retorne o título, sem aspas.`
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
              }
            }
          } catch (aiError) {
            console.error('Erro ao gerar título:', aiError);
          }
        }

        // Não buscar votações para otimizar performance
        const quantidadeVotacoes = 0;

        const proposicaoProcessada = {
          id_proposicao: pl.id,
          sigla_tipo: pl.siglaTipo,
          numero: pl.numero,
          ano: pl.ano,
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
          ordem_cache: ordemCache - index, // Ordem decrescente
          updated_at: new Date().toISOString()
        };
        
        proposicoesProcessadas.push(proposicaoProcessada);

      } catch (error) {
        console.error(`Erro ao processar proposição ${pl.id}:`, error);
      }
    }

    console.log(`✅ Proposições processadas: ${proposicoesProcessadas.length}`);

    // Salvar em lote
    if (proposicoesProcessadas.length > 0) {
      const { error: upsertError } = await supabase
        .from('cache_proposicoes_recentes')
        .upsert(proposicoesProcessadas, { onConflict: 'id_proposicao' });

      if (upsertError) {
        console.error('Erro ao salvar proposições:', upsertError);
      }
    }

    // Atualizar progresso
    const totalProcessadosAtual = (progresso?.total_processados || 0) + proposicoesProcessadas.length;
    
    await supabase
      .from('cache_proposicoes_progresso')
      .update({
        ultima_pagina: proximaPagina,
        total_processados: totalProcessadosAtual,
        finalizado: proposicoes.length < 5 // Se retornou menos de 5, acabou
      })
      .eq('sigla_tipo', 'PL')
      .eq('data', dataHoje);

    console.log(`💾 Cache atualizado: ${proposicoesProcessadas.length} novas proposições (total hoje: ${totalProcessadosAtual})`);

    // Retornar todas as proposições do dia com dados completos
    const { data: todasDoDia } = await supabase
      .from('cache_proposicoes_recentes')
      .select('*')
      .not('autor_principal_nome', 'is', null)
      .not('autor_principal_foto', 'is', null)
      .gte('data_apresentacao', dataInicio)
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
    console.error('Erro geral:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
