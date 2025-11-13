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

    console.log('🎯 Iniciando transferência de links de narração para o CPC...');

    // 1. Buscar todos os registros da tabela artigo-editar
    const { data: artigosEditar, error: erroLeitura } = await supabase
      .from('artigo-editar')
      .select('artigo, link')
      .not('link', 'is', null)
      .not('artigo', 'is', null);

    if (erroLeitura) {
      console.error('❌ Erro ao ler artigo-editar:', erroLeitura);
      throw erroLeitura;
    }

    console.log(`📥 Encontrados ${artigosEditar?.length || 0} registros com links de narração`);

    if (!artigosEditar || artigosEditar.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Nenhum registro encontrado na tabela artigo-editar' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const resultados = {
      processados: 0,
      atualizados: 0,
      naoEncontrados: [] as string[],
      erros: [] as string[],
      detalhes: [] as any[]
    };

    // 2. Processar cada registro
    for (const registro of artigosEditar) {
      try {
        // Extrair número do artigo do nome do arquivo
        // Exemplos: "artigo.12.wav" → "12", "artigo.699-A.wav" → "699-A"
        const nomeArquivo = registro.artigo || '';
        const match = nomeArquivo.match(/artigo\.(\d+(?:-[A-Z])?)/i);
        
        if (!match) {
          console.warn(`⚠️ Não foi possível extrair número do artigo de: ${nomeArquivo}`);
          resultados.naoEncontrados.push(nomeArquivo);
          continue;
        }

        const numeroArtigo = match[1];
        resultados.processados++;

        console.log(`🔍 Processando Art. ${numeroArtigo} - Link: ${registro.link}`);

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
          resultados.naoEncontrados.push(`Art. ${numeroArtigo}`);
          continue;
        }

        // 4. Atualizar narração no CPC
        const { error: erroUpdate } = await supabase
          .from('CPC – Código de Processo Civil')
          .update({ 'Narração': registro.link })
          .eq('id', artigoCPC.id);

        if (erroUpdate) {
          console.error(`❌ Erro ao atualizar Art. ${numeroArtigo}:`, erroUpdate);
          resultados.erros.push(`Erro ao atualizar Art. ${numeroArtigo}: ${erroUpdate.message}`);
          continue;
        }

        resultados.atualizados++;
        resultados.detalhes.push({
          artigo: numeroArtigo,
          link: registro.link,
          status: 'atualizado'
        });

        console.log(`✅ Art. ${numeroArtigo} atualizado com sucesso`);

      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
        console.error(`❌ Erro ao processar ${registro.artigo}:`, errorMsg);
        resultados.erros.push(`Erro em ${registro.artigo}: ${errorMsg}`);
      }
    }

    console.log('\n📊 RESUMO DA TRANSFERÊNCIA:');
    console.log(`   ✅ Processados: ${resultados.processados}`);
    console.log(`   ✅ Atualizados: ${resultados.atualizados}`);
    console.log(`   ⚠️  Não encontrados: ${resultados.naoEncontrados.length}`);
    console.log(`   ❌ Erros: ${resultados.erros.length}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Transferência concluída: ${resultados.atualizados} artigos atualizados de ${resultados.processados} processados`,
        resultados: {
          processados: resultados.processados,
          atualizados: resultados.atualizados,
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
