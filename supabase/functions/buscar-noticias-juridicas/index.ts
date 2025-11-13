import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Variáveis de ambiente do Supabase não configuradas');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    console.log('🔍 Verificando cache de notícias...');
    
    // Verificar se há notícias recentes (últimos 10 minutos)
    const dezMinutosAtras = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { data: noticiasRecentes, error: errorRecentes } = await supabase
      .from('noticias_juridicas_cache')
      .select('id')
      .gte('created_at', dezMinutosAtras)
      .limit(1);

    // Se não há notícias recentes, chamar função de atualização
    if (!errorRecentes && (!noticiasRecentes || noticiasRecentes.length === 0)) {
      console.log('⚡ Cache desatualizado. Atualizando notícias da planilha...');
      try {
        const atualizarResponse = await fetch(
          `${SUPABASE_URL}/functions/v1/atualizar-noticias-juridicas`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        if (atualizarResponse.ok) {
          const resultado = await atualizarResponse.json();
          console.log(`✅ Cache atualizado: ${resultado.noticiasAdicionadas} notícias adicionadas`);
        } else {
          console.warn('⚠️ Erro ao atualizar cache, usando dados existentes');
        }
      } catch (updateError) {
        console.warn('⚠️ Falha na atualização automática:', updateError);
      }
    } else {
      console.log('✓ Cache está atualizado');
    }
    
    // Buscar notícias do cache, ordenadas por data mais recente
    const { data: noticias, error } = await supabase
      .from('noticias_juridicas_cache')
      .select('id, titulo, link, imagem, fonte, categoria, data_publicacao, analise_ia')
      .order('data_publicacao', { ascending: false })
      .limit(100);

    if (error) {
      console.error('❌ Erro ao buscar notícias:', error);
      throw error;
    }

    // Mapear para formato esperado pelo frontend
    const noticiasFormatadas = (noticias || []).map((noticia) => ({
      id: noticia.id.toString(),
      categoria: noticia.categoria || 'Geral',
      portal: noticia.fonte || 'Portal Jurídico',
      titulo: noticia.titulo,
      capa: noticia.imagem || '',
      link: noticia.link,
      dataHora: noticia.data_publicacao || new Date().toISOString(),
      analise_ia: noticia.analise_ia, // ← Incluir análise pré-gerada
    }));

    console.log(`${noticiasFormatadas.length} notícias encontradas no cache`);

    return new Response(
      JSON.stringify(noticiasFormatadas),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erro na função buscar-noticias-juridicas:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
