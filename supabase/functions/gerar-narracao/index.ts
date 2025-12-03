import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const { texto } = await req.json();

    if (!texto) {
      console.error('Missing required field: texto');
      return new Response(
        JSON.stringify({ error: 'texto é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Gerando narração para texto (${texto.length} caracteres): ${texto.substring(0, 50)}...`);

    // Get GER API key for Google Cloud TTS
    const API_KEY = Deno.env.get('GER');
    if (!API_KEY) {
      console.error('GER API key not configured');
      return new Response(
        JSON.stringify({ error: 'Chave API GER não configurada' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Call Google Cloud TTS API
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

    console.log(`Áudio gerado com sucesso: ${audioContent.length} bytes (base64)`);

    return new Response(
      JSON.stringify({ audioBase64: audioContent }),
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
