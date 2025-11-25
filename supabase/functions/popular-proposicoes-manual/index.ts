import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const DIREITO_PREMIUM_API_KEY = Deno.env.get('DIREITO_PREMIUM_API_KEY');
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🚀 Iniciando população manual das proposições...');

    // Resetar progresso
    await supabase.from('cache_proposicoes_progresso').delete().in('sigla_tipo', ['PL', 'PLP']);
    console.log('✅ Progresso resetado');

    // Limpar cache antigo
    await supabase.from('cache_proposicoes_recentes').delete().neq('id_proposicao', 0);
    await supabase.from('cache_plp_recentes').delete().neq('id_proposicao', 0);
    console.log('✅ Cache limpo');

    // Buscar PLs reais da API dos últimos 30 dias
    const dataHoje = new Date().toISOString().split('T')[0];
    const dataInicio = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    console.log(`📅 Buscando PLs de ${dataInicio} até ${dataHoje}`);
    
    const plsResponse = await fetch(
      `https://dadosabertos.camara.leg.br/api/v2/proposicoes?siglaTipo=PL&dataApresentacaoInicio=${dataInicio}&dataApresentacaoFim=${dataHoje}&ordem=DESC&ordenarPor=id&itens=30`,
      { headers: { 'Accept': 'application/json' } }
    );
    
    if (!plsResponse.ok) {
      throw new Error('Erro ao buscar PLs da API');
    }
    
    const plsData = await plsResponse.json();
    const plsRecentes = plsData.dados || [];

    const plsProcessados = [];
    console.log(`🔄 Processando ${plsRecentes.length} PLs...`);
    
    for (const [index, pl] of plsRecentes.entries()) {
      try {
        console.log(`  ${index + 1}/${plsRecentes.length}: PL ${pl.numero}/${pl.ano}`);
        
        // Buscar detalhes completos
        const detalhesResponse = await fetch(
          `https://dadosabertos.camara.leg.br/api/v2/proposicoes/${pl.id}`,
          { headers: { 'Accept': 'application/json' } }
        );
        
        if (!detalhesResponse.ok) continue;
        
        const detalhes = await detalhesResponse.json();
        const propData = detalhes.dados;
        
        // Buscar autores
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
          autorPrincipal = autoresCompletos.find((a: any) => a.tipo === 'Autor') || autoresCompletos[0];
          
          // Buscar foto do deputado
          if (autorPrincipal?.nome) {
            try {
              const buscaResponse = await fetch(
                `https://dadosabertos.camara.leg.br/api/v2/deputados?nome=${encodeURIComponent(autorPrincipal.nome)}&ordem=ASC&ordenarPor=nome`,
                { headers: { 'Accept': 'application/json' } }
              );
              
              if (buscaResponse.ok) {
                const buscaData = await buscaResponse.json();
                if (buscaData.dados && buscaData.dados.length > 0) {
                  fotoAutor = buscaData.dados[0].urlFoto || null;
                  console.log(`    ✅ Foto encontrada para ${autorPrincipal.nome}`);
                }
              }
            } catch (fotoError) {
              console.error(`    ⚠️ Erro ao buscar foto: ${fotoError}`);
            }
          }
        }
        
        // Gerar título com IA
        let tituloGerado = null;
        const ementa = propData.ementa || pl.ementa;
        
        if (ementa && DIREITO_PREMIUM_API_KEY) {
          try {
            const aiResponse = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${DIREITO_PREMIUM_API_KEY}`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  contents: [{
                    parts: [{
                      text: `Crie um título jornalístico curto e claro (máximo 80 caracteres) para: "${ementa}"`
                    }]
                  }],
                  generationConfig: { temperature: 0.7, maxOutputTokens: 100 }
                })
              }
            );
            
            if (aiResponse.ok) {
              const aiData = await aiResponse.json();
              tituloGerado = aiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
            }
          } catch (aiError) {
            console.error('Erro ao gerar título:', aiError);
          }
        }
        
        const proposicaoProcessada = {
          id_proposicao: pl.id,
          sigla_tipo: pl.siglaTipo,
          numero: pl.numero,
          ano: pl.ano,
          ementa: ementa,
          titulo_gerado_ia: tituloGerado,
          data_apresentacao: propData.dataApresentacao || new Date().toISOString(),
          autor_principal_id: autorPrincipal ? (
            autorPrincipal.uri?.split('/').pop() || 
            autorPrincipal.uriAutor?.split('/').pop()
          ) : null,
          autor_principal_nome: autorPrincipal?.nome || 'Autor desconhecido',
          autor_principal_foto: fotoAutor,
          autor_principal_partido: autorPrincipal?.siglaPartido,
          autor_principal_uf: autorPrincipal?.siglaUf,
          autores_completos: autoresCompletos,
          status: propData.statusProposicao?.descricaoTramitacao,
          situacao: propData.statusProposicao?.descricaoSituacao,
          tema: propData.tema,
          keywords: propData.keywords || [],
          quantidade_votacoes: 0,
          orgao_tramitacao: propData.statusProposicao?.siglaOrgao,
          url_inteiro_teor: propData.urlInteiroTeor,
          ordem_cache: Date.now() - index,
          updated_at: new Date().toISOString()
        };
        
        plsProcessados.push(proposicaoProcessada);
      } catch (error) {
        console.error(`Erro ao processar PL ${pl.id}:`, error);
      }
    }

    if (plsProcessados.length > 0) {
      const { error: plError } = await supabase
        .from('cache_proposicoes_recentes')
        .insert(plsProcessados);

      if (plError) {
        console.error('Erro ao inserir PLs:', plError);
        throw plError;
      }
      console.log(`✅ ${plsProcessados.length} PLs inseridos com sucesso`);
    }

    // Buscar PLPs reais da API dos últimos 30 dias
    console.log(`📅 Buscando PLPs de ${dataInicio} até ${dataHoje}`);
    
    const plpsResponse = await fetch(
      `https://dadosabertos.camara.leg.br/api/v2/proposicoes?siglaTipo=PLP&dataApresentacaoInicio=${dataInicio}&dataApresentacaoFim=${dataHoje}&ordem=DESC&ordenarPor=id&itens=20`,
      { headers: { 'Accept': 'application/json' } }
    );
    
    if (!plpsResponse.ok) {
      throw new Error('Erro ao buscar PLPs da API');
    }
    
    const plpsData = await plpsResponse.json();
    const plpsRecentes = plpsData.dados || [];

    const plpsProcessados = [];
    console.log(`🔄 Processando ${plpsRecentes.length} PLPs...`);
    
    for (const [index, plp] of plpsRecentes.entries()) {
      try {
        console.log(`  ${index + 1}/${plpsRecentes.length}: PLP ${plp.numero}/${plp.ano}`);
        
        const detalhesResponse = await fetch(
          `https://dadosabertos.camara.leg.br/api/v2/proposicoes/${plp.id}`,
          { headers: { 'Accept': 'application/json' } }
        );
        
        if (!detalhesResponse.ok) continue;
        
        const detalhes = await detalhesResponse.json();
        const propData = detalhes.dados;
        
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
          autorPrincipal = autoresCompletos.find((a: any) => a.tipo === 'Autor') || autoresCompletos[0];
          
          // Buscar foto do deputado
          if (autorPrincipal?.nome) {
            try {
              const buscaResponse = await fetch(
                `https://dadosabertos.camara.leg.br/api/v2/deputados?nome=${encodeURIComponent(autorPrincipal.nome)}&ordem=ASC&ordenarPor=nome`,
                { headers: { 'Accept': 'application/json' } }
              );
              
              if (buscaResponse.ok) {
                const buscaData = await buscaResponse.json();
                if (buscaData.dados && buscaData.dados.length > 0) {
                  fotoAutor = buscaData.dados[0].urlFoto || null;
                  console.log(`    ✅ Foto encontrada para ${autorPrincipal.nome}`);
                }
              }
            } catch (fotoError) {
              console.error(`    ⚠️ Erro ao buscar foto: ${fotoError}`);
            }
          }
        }
        
        let tituloGerado = null;
        const ementa = propData.ementa || plp.ementa;
        
        if (ementa && DIREITO_PREMIUM_API_KEY) {
          try {
            const aiResponse = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${DIREITO_PREMIUM_API_KEY}`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  contents: [{
                    parts: [{
                      text: `Crie um título jornalístico curto e claro (máximo 80 caracteres) para: "${ementa}"`
                    }]
                  }],
                  generationConfig: { temperature: 0.7, maxOutputTokens: 100 }
                })
              }
            );
            
            if (aiResponse.ok) {
              const aiData = await aiResponse.json();
              tituloGerado = aiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
            }
          } catch (aiError) {
            console.error('Erro ao gerar título:', aiError);
          }
        }
        
        const proposicaoProcessada = {
          id_proposicao: plp.id,
          sigla_tipo: plp.siglaTipo,
          numero: plp.numero,
          ano: plp.ano,
          ementa: ementa,
          titulo_gerado_ia: tituloGerado,
          data_apresentacao: propData.dataApresentacao || new Date().toISOString(),
          autor_principal_id: autorPrincipal ? (
            autorPrincipal.uri?.split('/').pop() || 
            autorPrincipal.uriAutor?.split('/').pop()
          ) : null,
          autor_principal_nome: autorPrincipal?.nome || 'Autor desconhecido',
          autor_principal_foto: fotoAutor,
          autor_principal_partido: autorPrincipal?.siglaPartido,
          autor_principal_uf: autorPrincipal?.siglaUf,
          autores_completos: autoresCompletos,
          status: propData.statusProposicao?.descricaoTramitacao,
          situacao: propData.statusProposicao?.descricaoSituacao,
          tema: propData.tema,
          keywords: propData.keywords || [],
          quantidade_votacoes: 0,
          orgao_tramitacao: propData.statusProposicao?.siglaOrgao,
          url_inteiro_teor: propData.urlInteiroTeor,
          ordem_cache: Date.now() - index,
          updated_at: new Date().toISOString()
        };
        
        plpsProcessados.push(proposicaoProcessada);
      } catch (error) {
        console.error(`Erro ao processar PLP ${plp.id}:`, error);
      }
    }

    if (plpsProcessados.length > 0) {
      const { error: plpError } = await supabase
        .from('cache_plp_recentes')
        .insert(plpsProcessados);

      if (plpError) {
        console.error('Erro ao inserir PLPs:', plpError);
        throw plpError;
      }
      console.log(`✅ ${plpsProcessados.length} PLPs inseridos com sucesso`);
    }

    // Marcar progresso como finalizado
    await supabase.from('cache_proposicoes_progresso').upsert([
      {
        sigla_tipo: 'PL',
        data: dataHoje,
        ultima_pagina: 1,
        total_processados: plsProcessados.length,
        finalizado: true
      },
      {
        sigla_tipo: 'PLP',
        data: dataHoje,
        ultima_pagina: 1,
        total_processados: plpsProcessados.length,
        finalizado: true
      }
    ], { onConflict: 'sigla_tipo,data' });

    console.log('✅ Progresso atualizado');

    return new Response(JSON.stringify({
      success: true,
      message: 'Proposições populadas com sucesso!',
      stats: {
        pls: plsProcessados.length,
        plps: plpsProcessados.length,
        total: plsProcessados.length + plpsProcessados.length
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Erro ao popular proposições:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
