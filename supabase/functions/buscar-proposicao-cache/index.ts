import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CACHE_VALIDITY_DAYS = 7;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { idProposicao } = await req.json();
    
    if (!idProposicao) {
      throw new Error('idProposicao é obrigatório');
    }

    console.log('🔍 Buscando proposição:', idProposicao);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Tentar buscar do cache (válido por 7 dias)
    const cacheValidSince = new Date(Date.now() - CACHE_VALIDITY_DAYS * 24 * 60 * 60 * 1000).toISOString();
    
    const { data: cacheData, error: cacheError } = await supabase
      .from('cache_proposicoes_recentes')
      .select('*')
      .eq('id_proposicao', idProposicao)
      .gte('updated_at', cacheValidSince)
      .single();

    if (!cacheError && cacheData) {
      console.log('✅ Proposição encontrada no cache');
      
      // Buscar autores da API (rápido)
      let autores = cacheData.autores_completos || [];
      
      if (!autores.length) {
        try {
          const autoresResponse = await fetch(
            `https://dadosabertos.camara.leg.br/api/v2/proposicoes/${idProposicao}/autores`,
            { headers: { 'Accept': 'application/json' } }
          );
          if (autoresResponse.ok) {
            const autoresData = await autoresResponse.json();
            autores = autoresData.dados || [];
          }
        } catch (e) {
          console.error('Erro ao buscar autores:', e);
        }
      }

      return new Response(JSON.stringify({
        proposicao: {
          id: cacheData.id_proposicao,
          siglaTipo: cacheData.sigla_tipo,
          numero: cacheData.numero,
          ano: cacheData.ano,
          ementa: cacheData.ementa,
          tituloGeradoIA: cacheData.titulo_gerado_ia,
          dataApresentacao: cacheData.data_apresentacao,
          urlInteiroTeor: cacheData.url_inteiro_teor,
          status: cacheData.status,
          situacao: cacheData.situacao,
          tema: cacheData.tema,
          keywords: cacheData.keywords,
          quantidadeVotacoes: cacheData.quantidade_votacoes,
          orgaoTramitacao: cacheData.orgao_tramitacao,
        },
        autores: autores,
        votacoes: cacheData.votacoes || [],
        fromCache: true
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('⚡ Cache não encontrado ou expirado, buscando da API...');

    // 2. Buscar da API
    const detalhesResponse = await fetch(
      `https://dadosabertos.camara.leg.br/api/v2/proposicoes/${idProposicao}`,
      { headers: { 'Accept': 'application/json' } }
    );

    if (!detalhesResponse.ok) {
      throw new Error(`Erro ao buscar proposição: ${detalhesResponse.status}`);
    }

    const detalhesData = await detalhesResponse.json();
    const propData = detalhesData.dados;

    // Buscar autores
    const autoresResponse = await fetch(
      `https://dadosabertos.camara.leg.br/api/v2/proposicoes/${idProposicao}/autores`,
      { headers: { 'Accept': 'application/json' } }
    );
    const autoresData = await autoresResponse.json();
    const autores = autoresData.dados || [];

    // Buscar votações com estatísticas
    let votacoes = [];
    try {
      const votacoesUrl = `https://dadosabertos.camara.leg.br/api/v2/proposicoes/${idProposicao}/votacoes`;
      const votacoesResponse = await fetch(votacoesUrl, {
        headers: { 'Accept': 'application/json' },
      });
      
      if (votacoesResponse.ok) {
        const votacoesData = await votacoesResponse.json();
        votacoes = votacoesData.dados || [];
        
        // Buscar votos detalhados (limitar a 5 votações)
        for (let i = 0; i < Math.min(votacoes.length, 5); i++) {
          try {
            const votosUrl = `https://dadosabertos.camara.leg.br/api/v2/votacoes/${votacoes[i].id}/votos`;
            const votosResponse = await fetch(votosUrl, {
              headers: { 'Accept': 'application/json' },
            });
            
            if (votosResponse.ok) {
              const votosData = await votosResponse.json();
              const votos = votosData.dados || [];
              
              const sim = votos.filter((v: any) => v.tipoVoto === "Sim").length;
              const nao = votos.filter((v: any) => v.tipoVoto === "Não").length;
              const abstencao = votos.filter((v: any) => v.tipoVoto === "Abstenção").length;
              const obstrucao = votos.filter((v: any) => v.tipoVoto === "Obstrução").length;
              
              votacoes[i].stats = { sim, nao, abstencao, obstrucao, total: votos.length };
            }
          } catch (e) {
            console.error('Erro ao buscar votos:', e);
            votacoes[i].stats = { sim: 0, nao: 0, abstencao: 0, obstrucao: 0, total: 0 };
          }
        }
      }
    } catch (e) {
      console.error('Erro ao buscar votações:', e);
    }

    // Buscar tramitações
    let tramitacoes = [];
    try {
      const tramitacoesUrl = `https://dadosabertos.camara.leg.br/api/v2/proposicoes/${idProposicao}/tramitacoes`;
      const tramitacoesResponse = await fetch(tramitacoesUrl, {
        headers: { 'Accept': 'application/json' },
      });
      
      if (tramitacoesResponse.ok) {
        const tramitacoesData = await tramitacoesResponse.json();
        tramitacoes = (tramitacoesData.dados || []).slice(0, 10); // Últimas 10
      }
    } catch (e) {
      console.error('Erro ao buscar tramitações:', e);
    }

    // Buscar autor principal e foto
    let autorPrincipal = autores.find((a: any) => a.tipo === 'Autor') || autores[0];
    let fotoAutor = null;

    if (autorPrincipal) {
      let deputadoId = null;
      
      if (autorPrincipal.uri) {
        const match = autorPrincipal.uri.match(/\/deputados\/(\d+)/);
        if (match) deputadoId = match[1];
      }
      
      if (deputadoId) {
        try {
          const deputadoResponse = await fetch(
            `https://dadosabertos.camara.leg.br/api/v2/deputados/${deputadoId}`,
            { headers: { 'Accept': 'application/json' } }
          );

          if (deputadoResponse.ok) {
            const deputadoData = await deputadoResponse.json();
            fotoAutor = deputadoData.dados?.ultimoStatus?.urlFoto || deputadoData.dados?.urlFoto || null;
          }
        } catch (e) {
          console.error('Erro ao buscar foto do autor:', e);
        }
      }
    }

    // Salvar no cache
    const cacheRecord = {
      id_proposicao: propData.id,
      sigla_tipo: propData.siglaTipo,
      numero: propData.numero,
      ano: propData.ano,
      ementa: propData.ementa,
      data_apresentacao: propData.dataApresentacao,
      url_inteiro_teor: propData.urlInteiroTeor,
      autor_principal_id: autorPrincipal ? (autorPrincipal.uri?.split('/').pop() || null) : null,
      autor_principal_nome: autorPrincipal?.nome,
      autor_principal_foto: fotoAutor,
      autor_principal_partido: autorPrincipal?.siglaPartido,
      autor_principal_uf: autorPrincipal?.siglaUf,
      autores_completos: autores,
      status: propData.statusProposicao?.descricaoTramitacao,
      situacao: propData.statusProposicao?.descricaoSituacao,
      tema: propData.tema,
      keywords: propData.keywords || [],
      quantidade_votacoes: votacoes.length,
      orgao_tramitacao: propData.statusProposicao?.siglaOrgao,
      votacoes: votacoes,
      ordem_cache: Date.now(),
      updated_at: new Date().toISOString()
    };

    await supabase
      .from('cache_proposicoes_recentes')
      .upsert(cacheRecord, { onConflict: 'id_proposicao' });

    console.log('💾 Proposição salva no cache');

    return new Response(JSON.stringify({
      proposicao: {
        id: propData.id,
        siglaTipo: propData.siglaTipo,
        numero: propData.numero,
        ano: propData.ano,
        ementa: propData.ementa,
        dataApresentacao: propData.dataApresentacao,
        urlInteiroTeor: propData.urlInteiroTeor,
        status: propData.statusProposicao?.descricaoTramitacao,
        situacao: propData.statusProposicao?.descricaoSituacao,
        tema: propData.tema,
        keywords: propData.keywords,
        quantidadeVotacoes: votacoes.length,
        orgaoTramitacao: propData.statusProposicao?.siglaOrgao,
      },
      autores: autores,
      votacoes: votacoes,
      tramitacoes: tramitacoes,
      fromCache: false
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Erro:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
