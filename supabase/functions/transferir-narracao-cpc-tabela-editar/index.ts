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

    console.log('🎯 Iniciando transferência de links de narração da TABELA PARA EDITAR para o CPC...');

    // 1. Buscar todos os registros da TABELA PARA EDITAR que têm áudio
    const { data: artigosEditar, error: erroLeitura } = await supabase
      .from('TABELA PARA EDITAR')
      .select('Artigo, "Narração"')
      .not('"Narração"', 'is', null);

    if (erroLeitura) {
      console.error('❌ Erro ao ler TABELA PARA EDITAR:', erroLeitura);
      throw erroLeitura;
    }

    console.log(`📥 Encontrados ${artigosEditar?.length || 0} registros na TABELA PARA EDITAR`);

    if (!artigosEditar || artigosEditar.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Nenhum registro encontrado na TABELA PARA EDITAR' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const resultados = {
      processados: 0,
      atualizados: 0,
      naoEncontrados: [] as string[],
      semLink: [] as string[],
      erros: [] as string[],
      detalhes: [] as any[]
    };

    // 2. Processar cada registro
    for (const registro of artigosEditar) {
      try {
        const numeroArtigo = registro.Artigo?.trim();
        const linkAudio = registro['Narração'] || '';
        
        if (!numeroArtigo) {
          console.warn(`⚠️ Registro sem número de artigo`);
          continue;
        }

        if (!linkAudio) {
          console.warn(`⚠️ Art. ${numeroArtigo}: Sem link de áudio`);
          resultados.semLink.push(numeroArtigo);
          continue;
        }

        resultados.processados++;
        console.log(`🔍 Processando Art. ${numeroArtigo} - Link: ${linkAudio}`);

        // 3. Buscar artigo correspondente no CPC
        const { data: artigoCPC, error: erroBusca } = await supabase
          .from('CPC – Código de Processo Civil')
          .select('id, "Número do Artigo", "Narração"')
          .eq('Número do Artigo', numeroArtigo)
          .maybeSingle();

        if (erroBusca) {
          console.error(`❌ Erro ao buscar Art. ${numeroArtigo}:`, erroBusca);
          resultados.erros.push(`Erro ao buscar Art. ${numeroArtigo}: ${erroBusca.message}`);
          continue;
        }

        if (!artigoCPC) {
          console.warn(`⚠️ Art. ${numeroArtigo} não encontrado no CPC`);
          resultados.naoEncontrados.push(numeroArtigo);
          continue;
        }

        // 4. Atualizar narração no CPC
        const { error: erroUpdate } = await supabase
          .from('CPC – Código de Processo Civil')
          .update({ 'Narração': linkAudio })
          .eq('id', artigoCPC.id);

        if (erroUpdate) {
          console.error(`❌ Erro ao atualizar Art. ${numeroArtigo}:`, erroUpdate);
          resultados.erros.push(`Erro ao atualizar Art. ${numeroArtigo}: ${erroUpdate.message}`);
          continue;
        }

        resultados.atualizados++;
        resultados.detalhes.push({
          artigo: numeroArtigo,
          link: linkAudio,
          status: 'atualizado'
        });

        console.log(`✅ Art. ${numeroArtigo} atualizado com sucesso`);

      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
        console.error(`❌ Erro ao processar registro:`, errorMsg);
        resultados.erros.push(`Erro no processamento: ${errorMsg}`);
      }
    }

    console.log('\n📊 RESUMO DA TRANSFERÊNCIA:');
    console.log(`   ✅ Processados: ${resultados.processados}`);
    console.log(`   ✅ Atualizados: ${resultados.atualizados}`);
    console.log(`   ⚠️  Sem link: ${resultados.semLink.length}`);
    console.log(`   ⚠️  Não encontrados: ${resultados.naoEncontrados.length}`);
    console.log(`   ❌ Erros: ${resultados.erros.length}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Transferência concluída: ${resultados.atualizados} artigos atualizados de ${resultados.processados} processados`,
        resultados: {
          processados: resultados.processados,
          atualizados: resultados.atualizados,
          semLink: resultados.semLink,
          naoEncontrados: resultados.naoEncontrados,
          erros: resultados.erros,
          detalhes: resultados.detalhes
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Erro na função:', error);
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
