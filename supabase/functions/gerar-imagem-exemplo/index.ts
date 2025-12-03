import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { InferenceClient } from 'https://esm.sh/@huggingface/inference@3.6.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { questaoId, exemploTexto } = await req.json()

    if (!questaoId || !exemploTexto) {
      throw new Error('questaoId e exemploTexto são obrigatórios')
    }

    console.log(`[gerar-imagem-exemplo] Processando questão ${questaoId}`)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 1. Verificar se já existe imagem no banco
    const { data: questao, error: fetchError } = await supabase
      .from('QUESTOES_GERADAS')
      .select('url_imagem_exemplo')
      .eq('id', questaoId)
      .single()

    if (fetchError) {
      console.error('[gerar-imagem-exemplo] Erro ao buscar questão:', fetchError)
    }

    if (questao?.url_imagem_exemplo) {
      console.log(`[gerar-imagem-exemplo] Imagem já existe para questão ${questaoId}, retornando cache`)
      return new Response(
        JSON.stringify({ url_imagem: questao.url_imagem_exemplo, cached: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. Gerar imagem com Hugging Face
    const HUGGING_FACE_ACCESS_TOKEN = Deno.env.get('HUGGING_FACE_ACCESS_TOKEN')
    if (!HUGGING_FACE_ACCESS_TOKEN) {
      throw new Error('HUGGING_FACE_ACCESS_TOKEN não configurado')
    }

    // Criar prompt descritivo para ilustrar a cena do exemplo prático
    const textoLimpo = exemploTexto
      .substring(0, 400)
      .replace(/[^\w\sáéíóúâêîôûãõàèìòùç.,!?-]/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim()

    const promptImagem = `Create a detailed illustration depicting this scene: "${textoLimpo}". 
The image should visually represent the people, places and situation described. 
Show characters with expressions and actions matching the story.
Style: warm editorial illustration, soft natural colors, friendly characters, clean composition, storytelling visual, no text or words in image.`

    console.log(`[gerar-imagem-exemplo] Gerando imagem com prompt: ${promptImagem.substring(0, 150)}...`)

    const client = new InferenceClient(HUGGING_FACE_ACCESS_TOKEN)
    const image = await client.textToImage({
      model: 'black-forest-labs/FLUX.1-schnell',
      inputs: promptImagem,
    })

    // 3. Converter para blob
    const arrayBuffer = await image.arrayBuffer()
    const imageBlob = new Blob([arrayBuffer], { type: 'image/png' })

    console.log(`[gerar-imagem-exemplo] Imagem gerada, tamanho: ${imageBlob.size} bytes`)

    // 4. Upload para Catbox
    const formData = new FormData()
    formData.append('reqtype', 'fileupload')
    formData.append('fileToUpload', imageBlob, `exemplo_${questaoId}_${Date.now()}.png`)

    const catboxResponse = await fetch('https://catbox.moe/user/api.php', {
      method: 'POST',
      body: formData
    })

    if (!catboxResponse.ok) {
      throw new Error(`Catbox upload falhou: ${catboxResponse.status}`)
    }

    const imageUrl = await catboxResponse.text()
    
    if (!imageUrl.startsWith('https://')) {
      throw new Error(`URL inválida do Catbox: ${imageUrl}`)
    }

    console.log(`[gerar-imagem-exemplo] Upload Catbox sucesso: ${imageUrl}`)

    // 5. Salvar URL no banco
    const { error: updateError } = await supabase
      .from('QUESTOES_GERADAS')
      .update({ url_imagem_exemplo: imageUrl })
      .eq('id', questaoId)

    if (updateError) {
      console.error('[gerar-imagem-exemplo] Erro ao salvar URL:', updateError)
    } else {
      console.log(`[gerar-imagem-exemplo] URL salva no banco para questão ${questaoId}`)
    }

    return new Response(
      JSON.stringify({ url_imagem: imageUrl, cached: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('[gerar-imagem-exemplo] Erro:', error)
    return new Response(
      JSON.stringify({ error: 'Erro ao gerar imagem', details: error?.message || 'Erro desconhecido' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
