import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.78.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Iniciando cópia dos artigos da Lei de Lavagem de Dinheiro...');

    // Buscar todos os artigos da tabela origem
    const { data: artigosOrigem, error: erroLeitura } = await supabase
      .from('TABELA PARA EDITAR')
      .select('Artigo, "Número do Artigo"')
      .order('id');

    if (erroLeitura) {
      console.error('Erro ao ler tabela origem:', erroLeitura);
      throw erroLeitura;
    }

    console.log(`Encontrados ${artigosOrigem?.length || 0} registros para copiar`);

    if (!artigosOrigem || artigosOrigem.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Nenhum artigo encontrado na tabela origem' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Preparar dados para inserção
    const artigosParaInserir = artigosOrigem.map(artigo => ({
      'Artigo': artigo.Artigo,
      'Número do Artigo': artigo['Número do Artigo']
    }));

    // Inserir na tabela destino
    const { data: artigosInseridos, error: erroInsercao } = await supabase
      .from('LLD - Lei de Lavagem de Dinheiro')
      .insert(artigosParaInserir)
      .select();

    if (erroInsercao) {
      console.error('Erro ao inserir artigos:', erroInsercao);
      throw erroInsercao;
    }

    console.log(`Cópia concluída com sucesso! ${artigosInseridos?.length || 0} artigos inseridos.`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `${artigosInseridos?.length || 0} artigos copiados com sucesso`,
        total: artigosInseridos?.length 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro na função:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
