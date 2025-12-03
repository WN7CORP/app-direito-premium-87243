import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { resumoId, tipo, conteudo, area, tema } = await req.json()

    if (!resumoId || !tipo || !conteudo) {
      throw new Error('resumoId, tipo e conteudo são obrigatórios')
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY não configurado')
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Determinar coluna baseado no tipo
    const colunaMap: Record<string, string> = {
      'resumo': 'url_imagem_resumo',
      'exemplo1': 'url_imagem_exemplo_1',
      'exemplo2': 'url_imagem_exemplo_2',
      'exemplo3': 'url_imagem_exemplo_3'
    }
    const coluna = colunaMap[tipo]
    if (!coluna) {
      throw new Error('Tipo inválido. Use: resumo, exemplo1, exemplo2, exemplo3')
    }

    // Verificar cache no banco
    const { data: resumoData, error: fetchError } = await supabase
      .from('RESUMO')
      .select('url_imagem_resumo, url_imagem_exemplo_1, url_imagem_exemplo_2, url_imagem_exemplo_3')
      .eq('id', resumoId)
      .single()

    if (fetchError) {
      console.error('Erro ao buscar resumo:', fetchError)
      throw new Error('Resumo não encontrado')
    }

    const urlExistente = resumoData?.[coluna as keyof typeof resumoData] as string | null
    if (urlExistente) {
      console.log('Imagem em cache:', urlExistente)
      return new Response(
        JSON.stringify({ url_imagem: urlExistente, cached: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Gerar prompt no estilo sketchnote/desenho à mão
    const contexto = conteudo.substring(0, 300).replace(/[#*_\[\]]/g, '')
    
    const prompt = `Create a hand-drawn sketch style illustration for legal education.
Area: ${area || 'Direito'}
Topic: ${tema || 'Legal concept'}
Context: ${contexto}

STYLE REQUIREMENTS:
- Hand-drawn pencil/pen sketch style with black lines on white grid notebook paper background
- Simple stick figure characters with basic details (hair, clothing outlines)
- Clean line art illustration like educational sketchnotes
- Include simple legal icons: scales of justice, gavels, books, documents, arrows
- Diagram-style layout showing relationships between concepts
- Light crosshatching for shading
- Notebook grid paper texture in background
- Black ink drawing style on white/cream paper

CRITICAL: The image must contain absolutely NO TEXT, NO LETTERS, NO WORDS, NO LABELS, NO NUMBERS.
Only visual elements: stick figures, icons, arrows, simple objects. NO TYPOGRAPHY of any kind.`

    console.log('Gerando imagem com Nano Banana (Gemini)...')

    // Chamar Lovable AI Gateway com modelo de imagem
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [{
          role: "user",
          content: prompt
        }],
        modalities: ["image", "text"]
      })
    })

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text()
      console.error('Erro na API Lovable AI:', aiResponse.status, errorText)
      throw new Error(`Erro na geração de imagem: ${aiResponse.status}`)
    }

    const aiData = await aiResponse.json()
    console.log('Resposta AI recebida')

    // Extrair imagem base64 da resposta
    const imageBase64 = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url
    if (!imageBase64) {
      console.error('Resposta sem imagem:', JSON.stringify(aiData).substring(0, 500))
      throw new Error('Nenhuma imagem gerada na resposta')
    }

    // Converter base64 para Uint8Array
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '')
    const binaryString = atob(base64Data)
    const uint8Array = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      uint8Array[i] = binaryString.charCodeAt(i)
    }

    // Upload para Catbox.moe
    console.log('Fazendo upload para Catbox...')
    const formData = new FormData()
    formData.append('reqtype', 'fileupload')
    formData.append('fileToUpload', new Blob([uint8Array], { type: 'image/png' }), `resumo_${resumoId}_${tipo}.png`)

    const catboxResponse = await fetch('https://catbox.moe/user/api.php', {
      method: 'POST',
      body: formData
    })

    if (!catboxResponse.ok) {
      throw new Error('Falha no upload para Catbox')
    }

    const imageUrl = await catboxResponse.text()
    console.log('Imagem uploaded:', imageUrl)

    // Salvar URL no banco
    const updateData: Record<string, string> = {}
    updateData[coluna] = imageUrl

    const { error: updateError } = await supabase
      .from('RESUMO')
      .update(updateData)
      .eq('id', resumoId)

    if (updateError) {
      console.error('Erro ao salvar URL:', updateError)
    } else {
      console.log('URL salva no banco com sucesso')
    }

    return new Response(
      JSON.stringify({ url_imagem: imageUrl, cached: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('Erro ao gerar imagem:', error)
    return new Response(
      JSON.stringify({ error: 'Erro ao gerar imagem', details: error?.message || 'Erro desconhecido' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
