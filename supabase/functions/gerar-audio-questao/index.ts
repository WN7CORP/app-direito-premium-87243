import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { questaoId, texto } = await req.json();

    if (!questaoId || !texto) {
      console.error('Missing required fields: questaoId or texto');
      return new Response(
        JSON.stringify({ error: 'questaoId e texto são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Verificando se questão ${questaoId} já tem áudio...`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if audio already exists
    const { data: questao, error: fetchError } = await supabase
      .from('QUESTOES_GERADAS')
      .select('url_audio')
      .eq('id', questaoId)
      .maybeSingle();

    if (fetchError) {
      console.error('Erro ao buscar questão:', fetchError);
      // Continue to generate new audio
    }

    // If audio already exists, return it immediately
    if (questao?.url_audio) {
      console.log(`✅ Áudio já existe para questão ${questaoId}: ${questao.url_audio}`);
      return new Response(
        JSON.stringify({ url_audio: questao.url_audio, cached: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Gerando NOVO áudio para questão ${questaoId}...`);
    console.log(`Texto (${texto.length} caracteres): ${texto.substring(0, 100)}...`);

    // Get GER API key for Google Cloud TTS
    const API_KEY = Deno.env.get('GER');
    if (!API_KEY) {
      console.error('GER API key not configured');
      return new Response(
        JSON.stringify({ error: 'Chave API GER não configurada' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1. Call Google Cloud TTS API
    console.log('Calling Google TTS API...');
    const ttsResponse = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: { text: texto },
          voice: {
            languageCode: 'pt-BR',
            name: 'pt-BR-Chirp3-HD-Sadaltager',
          },
          audioConfig: {
            audioEncoding: 'MP3',
            speakingRate: 1.0,
            pitch: 0.0,
          },
        }),
      }
    );

    if (!ttsResponse.ok) {
      const errorText = await ttsResponse.text();
      console.error('Google TTS error:', ttsResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: 'Erro ao gerar áudio TTS', details: errorText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const ttsData = await ttsResponse.json();
    const audioContent = ttsData.audioContent; // Base64 encoded audio

    if (!audioContent) {
      console.error('No audio content returned from TTS');
      return new Response(
        JSON.stringify({ error: 'TTS não retornou áudio' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Audio generated: ${audioContent.length} bytes (base64)`);

    // 2. Convert base64 to blob for upload
    const binaryString = atob(audioContent);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const audioBlob = new Blob([bytes], { type: 'audio/mpeg' });

    console.log(`Audio blob size: ${audioBlob.size} bytes`);

    // 3. Upload to Catbox.moe
    console.log('Uploading to Catbox.moe...');
    const formData = new FormData();
    formData.append('reqtype', 'fileupload');
    formData.append('fileToUpload', audioBlob, `questao_${questaoId}.mp3`);

    const catboxResponse = await fetch('https://catbox.moe/user/api.php', {
      method: 'POST',
      body: formData,
    });

    if (!catboxResponse.ok) {
      const errorText = await catboxResponse.text();
      console.error('Catbox upload error:', catboxResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: 'Erro ao fazer upload no Catbox', details: errorText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const audioUrl = await catboxResponse.text();
    console.log(`Audio uploaded successfully: ${audioUrl}`);

    // Validate the URL
    if (!audioUrl.startsWith('https://files.catbox.moe/')) {
      console.error('Invalid Catbox response:', audioUrl);
      return new Response(
        JSON.stringify({ error: 'Resposta inválida do Catbox', details: audioUrl }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Save URL to database
    console.log('Saving URL to database...');
    const { error: updateError } = await supabase
      .from('QUESTOES_GERADAS')
      .update({ url_audio: audioUrl })
      .eq('id', questaoId);

    if (updateError) {
      console.error('Database update error:', updateError);
      // Return the URL anyway since the audio was generated
      return new Response(
        JSON.stringify({ url_audio: audioUrl, warning: 'URL gerada mas não salva no banco' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Successfully completed for questão ${questaoId}`);

    return new Response(
      JSON.stringify({ url_audio: audioUrl }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno', details: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
