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
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🚀 Iniciando população manual das proposições...');

    // Resetar progresso
    await supabase.from('cache_proposicoes_progresso').delete().in('sigla_tipo', ['PL', 'PLP']);
    console.log('✅ Progresso resetado');

    // Limpar cache antigo
    await supabase.from('cache_proposicoes_recentes').delete().neq('id_proposicao', 0);
    await supabase.from('cache_plp_recentes').delete().neq('id_proposicao', 0);
    console.log('✅ Cache limpo');

    const ordemBase = Date.now();

    // PLs recentes (de hoje 25/11/2025)
    const pls = [
      {
        id_proposicao: 2587161,
        sigla_tipo: 'PL',
        numero: 5945,
        ano: 2025,
        ementa: 'Dispõe sobre a preservação dos proventos proporcionais ou integrais dos militares estaduais ativos ou inativos desligados da corporação por demissão ou exclusão, desde que cumpridos os requisitos legais de tempo de contribuição ao Sistema de Proteção Social dos Militares, e dá outras providências.',
        titulo_gerado_ia: 'Proventos de Militares: Preservação em Casos de Desligamento',
        data_apresentacao: '2025-11-25',
        autor_principal_nome: 'Capitão Alberto Neto',
        autor_principal_partido: 'PL',
        autor_principal_uf: 'AM',
        ordem_cache: ordemBase - 1,
        updated_at: new Date().toISOString()
      },
      {
        id_proposicao: 2587157,
        sigla_tipo: 'PL',
        numero: 5944,
        ano: 2025,
        ementa: 'Dispõe sobre normas gerais de segurança, transparência e responsabilidade na gestão dos investimentos realizados pelos Regimes Próprios de Previdência Social (RPPS) da União, dos Estados, do Distrito Federal e dos Municípios, e dá outras providências.',
        titulo_gerado_ia: 'Segurança e Transparência na Gestão dos RPPS',
        data_apresentacao: '2025-11-24',
        autor_principal_nome: 'Arthur Lira',
        autor_principal_partido: 'PP',
        autor_principal_uf: 'AL',
        ordem_cache: ordemBase - 2,
        updated_at: new Date().toISOString()
      },
      {
        id_proposicao: 2587155,
        sigla_tipo: 'PL',
        numero: 5943,
        ano: 2025,
        ementa: 'Altera a Lei nº 6.001, de 19 de dezembro de 1973, para dispor sobre a proteção da diversidade sexual e de gênero, a prevenção à discriminação e a promoção da inclusão de indígenas LGBTIA+, e dá outras providências.',
        titulo_gerado_ia: 'Proteção e Inclusão de Indígenas LGBTIA+',
        data_apresentacao: '2025-11-24',
        autor_principal_nome: 'Erika Hilton',
        autor_principal_partido: 'PSOL',
        autor_principal_uf: 'SP',
        ordem_cache: ordemBase - 3,
        updated_at: new Date().toISOString()
      },
      {
        id_proposicao: 2587114,
        sigla_tipo: 'PL',
        numero: 5942,
        ano: 2025,
        ementa: 'Dispõe sobre a criação do Serviço Nacional de Aprendizagem do Turismo - SENATUR e do Comitê Intersetorial de Investimento no Turismo.',
        titulo_gerado_ia: 'Criação do SENATUR: Qualificação Profissional no Turismo',
        data_apresentacao: '2025-11-24',
        autor_principal_nome: 'Celso Sabino',
        autor_principal_partido: 'UNIÃO',
        autor_principal_uf: 'PA',
        ordem_cache: ordemBase - 4,
        updated_at: new Date().toISOString()
      },
      {
        id_proposicao: 2587107,
        sigla_tipo: 'PL',
        numero: 5940,
        ano: 2025,
        ementa: 'Dispõe sobre a obrigatoriedade da prisão preventiva em crimes de violência física, sexual ou grave ameaça praticados contra a mulher, estabelece presunção legal de risco à vítima e restringe a concessão de liberdade do agressor.',
        titulo_gerado_ia: 'Prisão Preventiva Obrigatória em Crimes Contra Mulheres',
        data_apresentacao: '2025-11-24',
        autor_principal_nome: 'Delegada Adriana Accorsi',
        autor_principal_partido: 'PT',
        autor_principal_uf: 'GO',
        ordem_cache: ordemBase - 5,
        updated_at: new Date().toISOString()
      },
      {
        id_proposicao: 2587058,
        sigla_tipo: 'PL',
        numero: 5939,
        ano: 2025,
        ementa: 'Dispõe sobre a destinação e a forma de distribuição dos recursos destinados à valorização dos profissionais da educação básica pública, na forma do art. 212-A da Constituição Federal.',
        titulo_gerado_ia: 'Valorização dos Profissionais da Educação Básica',
        data_apresentacao: '2025-11-24',
        autor_principal_nome: 'Professor Alcides',
        autor_principal_partido: 'PL',
        autor_principal_uf: 'GO',
        ordem_cache: ordemBase - 6,
        updated_at: new Date().toISOString()
      }
    ];

    const { error: plError } = await supabase
      .from('cache_proposicoes_recentes')
      .insert(pls);

    if (plError) {
      console.error('Erro ao inserir PLs:', plError);
      throw plError;
    }
    console.log(`✅ ${pls.length} PLs inseridos com sucesso`);

    // PLPs recentes
    const plps = [
      {
        id_proposicao: 2586852,
        sigla_tipo: 'PLP',
        numero: 244,
        ano: 2025,
        ementa: 'Acrescenta hipótese de inelegibilidade à Lei Complementar nº 64, de 18 de maio de 1990, para dispor sobre a inelegibilidade decorrente do descumprimento da obrigatoriedade constitucional e legal de assegurar o piso salarial profissional nacional do magistério público da educação básica.',
        titulo_gerado_ia: 'Inelegibilidade por Descumprimento do Piso do Magistério',
        data_apresentacao: '2025-11-24',
        autor_principal_nome: 'Idilvan Alencar',
        autor_principal_partido: 'PDT',
        autor_principal_uf: 'CE',
        ordem_cache: ordemBase - 1,
        updated_at: new Date().toISOString()
      },
      {
        id_proposicao: 2586334,
        sigla_tipo: 'PLP',
        numero: 243,
        ano: 2025,
        ementa: 'Dispõe sobre a substituição da contribuição previdenciária patronal incidente sobre a folha de pagamentos por contribuição incidente sobre a Contribuição sobre Bens e Serviços – CBS, e dá outras providências.',
        titulo_gerado_ia: 'Substituição da Contribuição Previdenciária Patronal',
        data_apresentacao: '2025-11-18',
        autor_principal_nome: 'Fernando Haddad',
        autor_principal_partido: 'PT',
        autor_principal_uf: 'SP',
        ordem_cache: ordemBase - 2,
        updated_at: new Date().toISOString()
      },
      {
        id_proposicao: 2585266,
        sigla_tipo: 'PLP',
        numero: 242,
        ano: 2025,
        ementa: 'Altera a Lei nº 4.320, de 17 de março de 1964, e a Lei Complementar nº 101, de 4 de maio de 2000, para tratar do Orçamento Sensível ao Clima.',
        titulo_gerado_ia: 'Orçamento Sensível ao Clima e Emergência Climática',
        data_apresentacao: '2025-11-14',
        autor_principal_nome: 'Fernanda Melchionna',
        autor_principal_partido: 'PSOL',
        autor_principal_uf: 'RS',
        ordem_cache: ordemBase - 3,
        updated_at: new Date().toISOString()
      },
      {
        id_proposicao: 2582866,
        sigla_tipo: 'PLP',
        numero: 240,
        ano: 2025,
        ementa: 'Altera o Decreto-Lei nº 5.452, de 1º de maio de 1943 – Consolidação das Leis do Trabalho (CLT) –, para instituir o regime jurídico aplicável ao trabalho plataformizado e dispor sobre transparência, proteção social e direitos no trabalho mediado por plataformas digitais.',
        titulo_gerado_ia: 'Regulamentação do Trabalho em Plataformas Digitais',
        data_apresentacao: '2025-11-07',
        autor_principal_nome: 'Luiz Marinho',
        autor_principal_partido: 'PT',
        autor_principal_uf: 'SP',
        ordem_cache: ordemBase - 4,
        updated_at: new Date().toISOString()
      }
    ];

    const { error: plpError } = await supabase
      .from('cache_plp_recentes')
      .insert(plps);

    if (plpError) {
      console.error('Erro ao inserir PLPs:', plpError);
      throw plpError;
    }
    console.log(`✅ ${plps.length} PLPs inseridos com sucesso`);

    // Marcar progresso como finalizado
    const dataHoje = new Date().toISOString().split('T')[0];
    
    await supabase.from('cache_proposicoes_progresso').upsert([
      {
        sigla_tipo: 'PL',
        data: dataHoje,
        ultima_pagina: 1,
        total_processados: pls.length,
        finalizado: true
      },
      {
        sigla_tipo: 'PLP',
        data: dataHoje,
        ultima_pagina: 1,
        total_processados: plps.length,
        finalizado: true
      }
    ], { onConflict: 'sigla_tipo,data' });

    console.log('✅ Progresso atualizado');

    return new Response(JSON.stringify({
      success: true,
      message: 'Proposições populadas com sucesso!',
      stats: {
        pls: pls.length,
        plps: plps.length,
        total: pls.length + plps.length
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
