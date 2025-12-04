import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Mapeamento de slugs para nomes de tabela
const tableNames: Record<string, string> = {
  cc: "CC - Código Civil",
  cp: "CP - Código Penal",
  cpc: "CPC – Código de Processo Civil",
  cpp: "CPP – Código de Processo Penal",
  cf: "CF - Constituição Federal",
  clt: "CLT - Consolidação das Leis do Trabalho",
  cdc: "CDC – Código de Defesa do Consumidor",
  ctn: "CTN – Código Tributário Nacional",
  ctb: "CTB Código de Trânsito Brasileiro",
  ce: "CE – Código Eleitoral",
  ca: "CA - Código de Águas",
  cba: "CBA Código Brasileiro de Aeronáutica",
  cbt: "CBT Código Brasileiro de Telecomunicações",
  ccom: "CCOM – Código Comercial",
  cdm: "CDM – Código de Minas",
  cpm: "CPM – Código Penal Militar",
  cppm: "CPPM – Código de Processo Penal Militar",
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { codigoTabela } = await req.json();

    if (!codigoTabela) {
      return new Response(
        JSON.stringify({ error: 'codigoTabela é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Resolver nome da tabela se for slug
    const nomeTabela = tableNames[codigoTabela.toLowerCase()] || codigoTabela;
    
    console.log(`[Background] Processando aulas para: ${nomeTabela}`);

    // Verificar/criar entrada na fila
    const { data: filaExistente, error: filaError } = await supabase
      .from('fila_geracao_aulas')
      .select('*')
      .eq('codigo_tabela', nomeTabela)
      .single();

    if (filaError && filaError.code !== 'PGRST116') {
      console.error('Erro ao buscar fila:', filaError);
    }

    // Se já está em processamento, retornar
    if (filaExistente?.em_processamento) {
      console.log(`[Background] Já existe processamento em andamento para ${nomeTabela}`);
      return new Response(
        JSON.stringify({ message: 'Processamento já em andamento', status: 'processing' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const ultimoProcessado = filaExistente?.ultimo_artigo_processado || 0;

    // Buscar próximo artigo sem aula gerada
    // Primeiro, buscar artigos da tabela do código
    const { data: artigos, error: artigosError } = await supabase
      .from(nomeTabela as any)
      .select('id, "Número do Artigo", Artigo')
      .order('id', { ascending: true })
      .gt('id', ultimoProcessado)
      .limit(5);

    if (artigosError) {
      console.error('Erro ao buscar artigos:', artigosError);
      throw new Error(`Erro ao buscar artigos: ${artigosError.message}`);
    }

    if (!artigos || artigos.length === 0) {
      console.log(`[Background] Todos os artigos já foram processados para ${nomeTabela}`);
      return new Response(
        JSON.stringify({ message: 'Todos os artigos processados', status: 'complete' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Filtrar artigos que ainda não têm aula
    const numerosArtigos = artigos.map(a => a["Número do Artigo"]).filter(Boolean);
    
    const { data: aulasExistentes } = await supabase
      .from('aulas_artigos')
      .select('numero_artigo')
      .eq('codigo_tabela', nomeTabela)
      .in('numero_artigo', numerosArtigos);

    const aulasSet = new Set((aulasExistentes || []).map(a => a.numero_artigo));
    
    // Encontrar primeiro artigo sem aula
    const artigoSemAula = artigos.find(a => 
      a["Número do Artigo"] && !aulasSet.has(a["Número do Artigo"])
    );

    if (!artigoSemAula) {
      // Atualizar fila para próximo lote
      const ultimoId = artigos[artigos.length - 1]?.id || ultimoProcessado;
      
      await supabase
        .from('fila_geracao_aulas')
        .upsert({
          codigo_tabela: nomeTabela,
          ultimo_artigo_processado: ultimoId,
          em_processamento: false,
          ultima_atualizacao: new Date().toISOString()
        }, { onConflict: 'codigo_tabela' });

      console.log(`[Background] Nenhum artigo sem aula encontrado neste lote para ${nomeTabela}`);
      return new Response(
        JSON.stringify({ message: 'Lote processado, nenhuma aula nova necessária', status: 'batch_complete' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Marcar como em processamento
    await supabase
      .from('fila_geracao_aulas')
      .upsert({
        codigo_tabela: nomeTabela,
        ultimo_artigo_processado: ultimoProcessado,
        em_processamento: true,
        ultima_atualizacao: new Date().toISOString()
      }, { onConflict: 'codigo_tabela' });

    console.log(`[Background] Gerando aula para artigo ${artigoSemAula["Número do Artigo"]} do ${nomeTabela}`);

    // Chamar a função de geração de aula
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/gerar-aula-artigo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({
          codigoTabela: nomeTabela,
          numeroArtigo: artigoSemAula["Número do Artigo"],
          conteudoArtigo: artigoSemAula.Artigo || ''
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Background] Erro ao gerar aula: ${errorText}`);
      } else {
        console.log(`[Background] Aula gerada com sucesso para artigo ${artigoSemAula["Número do Artigo"]}`);
      }
    } catch (genError) {
      console.error(`[Background] Erro ao chamar gerar-aula-artigo:`, genError);
    }

    // Atualizar fila
    await supabase
      .from('fila_geracao_aulas')
      .upsert({
        codigo_tabela: nomeTabela,
        ultimo_artigo_processado: artigoSemAula.id,
        em_processamento: false,
        ultima_atualizacao: new Date().toISOString()
      }, { onConflict: 'codigo_tabela' });

    return new Response(
      JSON.stringify({ 
        message: `Aula gerada para artigo ${artigoSemAula["Número do Artigo"]}`,
        artigo: artigoSemAula["Número do Artigo"],
        status: 'generated'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Background] Erro:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
