import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { resumoId, texto, tipo } = await req.json();
    
    if (!resumoId || !texto || !tipo) {
      throw new Error('resumoId, texto e tipo são obrigatórios');
    }

    const tiposValidos = ['resumo', 'exemplos', 'termos'];
    if (!tiposValidos.includes(tipo)) {
      throw new Error('tipo deve ser: resumo, exemplos ou termos');
    }

    console.log(`Gerando áudio ${tipo} para resumo ${resumoId}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verificar se já existe áudio no cache
    const coluna = `url_audio_${tipo}` as 'url_audio_resumo' | 'url_audio_exemplos' | 'url_audio_termos';
    const { data: resumo, error: fetchError } = await supabase
      .from('RESUMO')
      .select('url_audio_resumo, url_audio_exemplos, url_audio_termos')
      .eq('id', resumoId)
      .single();

    if (fetchError) {
      console.error('Erro ao buscar resumo:', fetchError);
    }

    // Se já tem áudio, retornar do cache
    const existingUrl = resumo?.[coluna];
    if (existingUrl) {
      console.log(`Áudio ${tipo} encontrado no cache`);
      return new Response(
        JSON.stringify({ url_audio: existingUrl, cached: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Limpar texto para narração (remover markdown)
    const textoLimpo = texto
      .replace(/#{1,6}\s?/g, '') // Remove headers markdown
      .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold
      .replace(/\*([^*]+)\*/g, '$1') // Remove italic
      .replace(/`([^`]+)`/g, '$1') // Remove code
      .replace(/>\s?/g, '') // Remove blockquotes
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links, keep text
      .replace(/[-*+]\s/g, '. ') // Convert list markers to pauses
      .replace(/\n{2,}/g, '. ') // Multiple newlines to pause
      .replace(/\n/g, ' ') // Single newline to space
      .replace(/\s{2,}/g, ' ') // Multiple spaces to single
      .trim()
      .substring(0, 5000); // Limite de caracteres

    if (!textoLimpo) {
      throw new Error('Texto vazio após limpeza');
    }

    console.log(`Texto limpo: ${textoLimpo.length} caracteres`);

    // Gerar áudio com Hugging Face usando modelo Bark (suporta português)
    const hfToken = Deno.env.get('HUGGING_FACE_ACCESS_TOKEN');
    if (!hfToken) {
      throw new Error('HUGGING_FACE_ACCESS_TOKEN não configurado');
    }

    // Limitar texto para Bark (máximo ~250 chars por vez para melhor qualidade)
    const textoParaAudio = textoLimpo.substring(0, 2000);

    console.log('Gerando áudio com suno/bark...');
    
    // Usar suno/bark que suporta múltiplos idiomas incluindo português
    const hfResponse = await fetch('https://api-inference.huggingface.co/models/suno/bark-small', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${hfToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        inputs: textoParaAudio,
      }),
    });

    if (!hfResponse.ok) {
      const errorText = await hfResponse.text();
      console.error('Erro HuggingFace:', hfResponse.status, errorText);
      
      // Se o modelo não estiver disponível, tentar modelo alternativo
      if (hfResponse.status === 503 || hfResponse.status === 404) {
        console.log('Tentando modelo alternativo espnet/kan-bayashi_ljspeech_vits...');
        
        const altResponse = await fetch('https://api-inference.huggingface.co/models/espnet/kan-bayashi_ljspeech_vits', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${hfToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ inputs: textoParaAudio }),
        });
        
        if (!altResponse.ok) {
          const altError = await altResponse.text();
          console.error('Erro modelo alternativo:', altResponse.status, altError);
          throw new Error(`Erro ao gerar áudio: ${altResponse.status} - ${altError}`);
        }
        
        const audioBlob = await altResponse.blob();
        console.log('Áudio gerado com modelo alternativo, tamanho:', audioBlob.size);
        
        // Continuar com upload
        const formData = new FormData();
        formData.append('reqtype', 'fileupload');
        formData.append('fileToUpload', audioBlob, `resumo_${tipo}_${resumoId}.wav`);

        console.log('Fazendo upload para Catbox...');
        
        const catboxResponse = await fetch('https://catbox.moe/user/api.php', {
          method: 'POST',
          body: formData,
        });

        if (!catboxResponse.ok) {
          throw new Error(`Erro no upload para Catbox: ${catboxResponse.status}`);
        }

        const audioUrl = await catboxResponse.text();
        
        if (!audioUrl.startsWith('http')) {
          throw new Error(`URL inválida do Catbox: ${audioUrl}`);
        }

        console.log('Upload concluído:', audioUrl);

        // Salvar URL no banco
        const updateData: Record<string, string> = {};
        updateData[coluna] = audioUrl;

        const { error: updateError } = await supabase
          .from('RESUMO')
          .update(updateData)
          .eq('id', resumoId);

        if (updateError) {
          console.error('Erro ao salvar URL no banco:', updateError);
        }

        return new Response(
          JSON.stringify({ url_audio: audioUrl, cached: false }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`Erro ao gerar áudio: ${hfResponse.status} - ${errorText}`);
    }

    const audioBlob = await hfResponse.blob();
    console.log('Áudio gerado, tamanho:', audioBlob.size);

    // Upload para Catbox
    const formData = new FormData();
    formData.append('reqtype', 'fileupload');
    formData.append('fileToUpload', audioBlob, `resumo_${tipo}_${resumoId}.wav`);

    console.log('Fazendo upload para Catbox...');
    
    const catboxResponse = await fetch('https://catbox.moe/user/api.php', {
      method: 'POST',
      body: formData,
    });

    if (!catboxResponse.ok) {
      throw new Error(`Erro no upload para Catbox: ${catboxResponse.status}`);
    }

    const audioUrl = await catboxResponse.text();
    
    if (!audioUrl.startsWith('http')) {
      throw new Error(`URL inválida do Catbox: ${audioUrl}`);
    }

    console.log('Upload concluído:', audioUrl);

    // Salvar URL no banco
    const updateData: Record<string, string> = {};
    updateData[coluna] = audioUrl;

    const { error: updateError } = await supabase
      .from('RESUMO')
      .update(updateData)
      .eq('id', resumoId);

    if (updateError) {
      console.error('Erro ao salvar URL no banco:', updateError);
    } else {
      console.log('URL salva no banco com sucesso');
    }

    return new Response(
      JSON.stringify({ url_audio: audioUrl, cached: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro:', error);
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
