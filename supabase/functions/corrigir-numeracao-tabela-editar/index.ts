import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Iniciando correção de numeração da TABELA PARA EDITAR...');

    // Buscar todos os registros com "Número do Artigo" = "1"
    const { data: artigosErrados, error: fetchError } = await supabase
      .from('TABELA PARA EDITAR')
      .select('id, "Número do Artigo", Artigo')
      .eq('Número do Artigo', '1');

    if (fetchError) {
      console.error('Erro ao buscar artigos:', fetchError);
      throw fetchError;
    }

    console.log(`Encontrados ${artigosErrados?.length || 0} artigos com numeração "1"`);

    const correcoes = [];
    const erros = [];
    let corrigidos = 0;

    for (const artigo of artigosErrados || []) {
      try {
        // Extrair o número real do artigo usando regex
        // Patterns: "Art. 1.000", "Art. 1.001", "Art.1.000", "Artigo 1.000", etc.
        const patterns = [
          /Art\.\s*(\d{1,4}\.\d{3}(?:-[A-Z])?)/i,  // Art. 1.000 ou Art. 1.000-A
          /Artigo\s+(\d{1,4}\.\d{3}(?:-[A-Z])?)/i, // Artigo 1.000
          /^(\d{1,4}\.\d{3}(?:-[A-Z])?)/,          // 1.000 no início
        ];

        let numeroReal = null;
        for (const pattern of patterns) {
          const match = artigo.Artigo?.match(pattern);
          if (match && match[1]) {
            numeroReal = match[1];
            break;
          }
        }

        if (!numeroReal) {
          console.log(`⚠️  ID ${artigo.id}: Não foi possível extrair número do conteúdo`);
          erros.push({
            id: artigo.id,
            motivo: 'Número não encontrado no conteúdo',
            preview: artigo.Artigo?.substring(0, 100)
          });
          continue;
        }

        // Atualizar o registro
        const { error: updateError } = await supabase
          .from('TABELA PARA EDITAR')
          .update({ 'Número do Artigo': numeroReal })
          .eq('id', artigo.id);

        if (updateError) {
          console.error(`Erro ao atualizar ID ${artigo.id}:`, updateError);
          erros.push({
            id: artigo.id,
            motivo: updateError.message,
            numeroExtraido: numeroReal
          });
        } else {
          console.log(`✅ ID ${artigo.id}: "1" → "${numeroReal}"`);
          correcoes.push({
            id: artigo.id,
            de: '1',
            para: numeroReal,
            preview: artigo.Artigo?.substring(0, 80)
          });
          corrigidos++;
        }

      } catch (error) {
        console.error(`Erro ao processar ID ${artigo.id}:`, error);
        erros.push({
          id: artigo.id,
          motivo: error instanceof Error ? error.message : String(error)
        });
      }
    }

    const resultado = {
      sucesso: true,
      total_encontrados: artigosErrados?.length || 0,
      total_corrigidos: corrigidos,
      total_erros: erros.length,
      correcoes,
      erros,
      mensagem: `Correção concluída: ${corrigidos} artigos atualizados de ${artigosErrados?.length || 0} encontrados`
    };

    console.log('\n=== RESUMO DA CORREÇÃO ===');
    console.log(`Total encontrados: ${resultado.total_encontrados}`);
    console.log(`Total corrigidos: ${resultado.total_corrigidos}`);
    console.log(`Total erros: ${resultado.total_erros}`);
    console.log('========================\n');

    return new Response(
      JSON.stringify(resultado),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Erro geral:', error);
    return new Response(
      JSON.stringify({ 
        sucesso: false, 
        erro: error instanceof Error ? error.message : 'Erro desconhecido',
        detalhes: String(error)
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
