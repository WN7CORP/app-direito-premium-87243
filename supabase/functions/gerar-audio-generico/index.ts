import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Mapeamento de tipo para coluna no banco
const TIPO_TO_COLUNA: Record<string, string> = {
  'enunciado': 'url_audio',
  'comentario': 'url_audio_comentario',
  'exemplo': 'url_audio_exemplo',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { questaoId, texto, tipo } = await req.json()

    if (!questaoId || !texto || !tipo) {
      throw new Error('questaoId, texto e tipo são obrigatórios')
    }

    const coluna = TIPO_TO_COLUNA[tipo]
    if (!coluna) {
      throw new Error(`Tipo inválido: ${tipo}. Use: enunciado, comentario, exemplo`)
    }

    console.log(`[gerar-audio-generico] Tipo: ${tipo}, Questão: ${questaoId}`)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 1. Verificar se já existe áudio no banco
    const { data: questao, error: fetchError } = await supabase
      .from('QUESTOES_GERADAS')
      .select(coluna)
      .eq('id', questaoId)
      .single()

    if (fetchError) {
      console.error('[gerar-audio-generico] Erro ao buscar questão:', fetchError)
    }

    // deno-lint-ignore no-explicit-any
    const audioExistente = questao ? (questao as any)[coluna] : null
    if (audioExistente) {
      console.log(`[gerar-audio-generico] Áudio já existe para ${tipo}, retornando cache`)
      return new Response(
        JSON.stringify({ url_audio: audioExistente, cached: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. Gerar áudio com Google TTS
    const GOOGLE_TTS_API_KEY = Deno.env.get('GOOGLE_TTS_API_KEY')
    if (!GOOGLE_TTS_API_KEY) {
      throw new Error('GOOGLE_TTS_API_KEY não configurado')
    }

    // Limitar texto para TTS (máx 5000 chars)
    const textoLimitado = texto.substring(0, 4900)

    console.log(`[gerar-audio-generico] Gerando áudio para ${tipo}...`)

    const ttsResponse = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${GOOGLE_TTS_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: { text: textoLimitado },
          voice: {
            languageCode: 'pt-BR',
            name: 'pt-BR-Wavenet-B',
            ssmlGender: 'MALE'
          },
          audioConfig: {
            audioEncoding: 'MP3',
            speakingRate: 1.0,
            pitch: 0
          }
        })
      }
    )

    if (!ttsResponse.ok) {
      const errorText = await ttsResponse.text()
      throw new Error(`Google TTS falhou: ${ttsResponse.status} - ${errorText}`)
    }

    const ttsData = await ttsResponse.json()
    const audioContent = ttsData.audioContent

    if (!audioContent) {
      throw new Error('Google TTS não retornou audioContent')
    }

    // 3. Converter base64 para blob e fazer upload para Catbox
    const binaryString = atob(audioContent)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    const audioBlob = new Blob([bytes], { type: 'audio/mpeg' })

    console.log(`[gerar-audio-generico] Áudio gerado, tamanho: ${audioBlob.size} bytes`)

    // 4. Upload para Catbox
    const formData = new FormData()
    formData.append('reqtype', 'fileupload')
    formData.append('fileToUpload', audioBlob, `audio_${tipo}_${questaoId}_${Date.now()}.mp3`)

    const catboxResponse = await fetch('https://catbox.moe/user/api.php', {
      method: 'POST',
      body: formData
    })

    if (!catboxResponse.ok) {
      throw new Error(`Catbox upload falhou: ${catboxResponse.status}`)
    }

    const audioUrl = await catboxResponse.text()
    
    if (!audioUrl.startsWith('https://')) {
      throw new Error(`URL inválida do Catbox: ${audioUrl}`)
    }

    console.log(`[gerar-audio-generico] Upload Catbox sucesso: ${audioUrl}`)

    // 5. Salvar URL no banco
    const updateObj: Record<string, string> = {}
    updateObj[coluna] = audioUrl

    const { error: updateError } = await supabase
      .from('QUESTOES_GERADAS')
      .update(updateObj)
      .eq('id', questaoId)

    if (updateError) {
      console.error('[gerar-audio-generico] Erro ao salvar URL:', updateError)
    } else {
      console.log(`[gerar-audio-generico] URL salva na coluna ${coluna} para questão ${questaoId}`)
    }

    return new Response(
      JSON.stringify({ url_audio: audioUrl, cached: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('[gerar-audio-generico] Erro:', error)
    return new Response(
      JSON.stringify({ error: 'Erro ao gerar áudio', details: error?.message || 'Erro desconhecido' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
