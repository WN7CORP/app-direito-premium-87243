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

    console.log(`Gerando áudio para questão ${questaoId}`);
    console.log(`Texto (${texto.length} caracteres): ${texto.substring(0, 100)}...`);

    // Get OpenAI API key
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'OpenAI API key não configurada' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1. Call OpenAI TTS API
    console.log('Calling OpenAI TTS API...');
    const ttsResponse = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: texto,
        voice: 'nova', // Brazilian Portuguese sounds better with nova
        response_format: 'mp3',
      }),
    });

    if (!ttsResponse.ok) {
      const errorText = await ttsResponse.text();
      console.error('OpenAI TTS error:', ttsResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: 'Erro ao gerar áudio TTS', details: errorText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Get audio as ArrayBuffer
    const audioBuffer = await ttsResponse.arrayBuffer();
    const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });

    console.log(`Audio generated: ${audioBlob.size} bytes`);

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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

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
