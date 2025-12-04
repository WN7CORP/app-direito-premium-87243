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

    const DIREITO_PREMIUM_API_KEY = Deno.env.get('DIREITO_PREMIUM_API_KEY')
    if (!DIREITO_PREMIUM_API_KEY) {
      throw new Error('DIREITO_PREMIUM_API_KEY não configurado')
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

    // Limpar conteúdo para usar no prompt
    const conteudoLimpo = conteudo
      .replace(/[#*_\[\]]/g, '')
      .replace(/\n+/g, ' ')
      .trim()

    // Gerar prompt baseado no tipo
    let prompt: string

    if (tipo.startsWith('exemplo')) {
      // Para EXEMPLOS: focar na CENA NARRATIVA específica
      prompt = `VISUAL SCENE ILLUSTRATION - NO TEXT ALLOWED

Based on this real case story, create a visual scene illustration:

"${conteudoLimpo.substring(0, 500)}"

DRAW THE SPECIFIC SCENE described above showing:
- The people involved (as simple stick figures with distinguishing features like gender, age, profession)
- The specific actions happening (stealing, running, confronting, etc.)
- The location/setting mentioned (bakery, store, court, street, etc.)
- Key objects from the story (bread, money, documents, etc.)
- Emotions and situations (hunger, desperation, conflict, etc.)

VISUAL STYLE:
- Hand-drawn sketch style with black ink on cream paper
- Simple but SPECIFIC to the story above
- Show the NARRATIVE MOMENT, not generic symbols
- Stick figures with clear actions and expressions
- Wide horizontal composition (16:9)

CRITICAL REQUIREMENTS:
⛔ ABSOLUTELY NO text, words, letters, labels or numbers anywhere
⛔ NO generic legal symbols - only illustrate what's in the story
⛔ MUST illustrate the SPECIFIC situation described, not abstract concepts
⛔ Show the ACTUAL PEOPLE and ACTIONS from the narrative
⛔ The image must tell the story visually without any written words

Output: A scene illustration showing the specific situation from the case story.`
    } else {
      // Para RESUMO: focar nos CONCEITOS do texto
      prompt = `LEGAL CONCEPT ILLUSTRATION - NO TEXT ALLOWED

Illustrate the main legal concepts from this summary:

"${conteudoLimpo.substring(0, 400)}"

Topic: ${area || 'Direito'} - ${tema || 'Legal concept'}

DRAW visual representations of:
- The key legal principles mentioned in the text
- Relationships between concepts (using arrows, connections)
- Symbolic representations of the specific situations described
- Visual metaphors for the legal rules explained

VISUAL STYLE:
- Minimalist sketchnote/mind-map style
- Black ink on cream paper
- Icons and symbols that represent SPECIFIC concepts from the text
- Stick figures showing relevant interactions
- Wide horizontal composition (16:9)

CRITICAL REQUIREMENTS:
⛔ ABSOLUTELY NO text, words, letters or numbers anywhere
⛔ Symbols must relate to the SPECIFIC content, not generic law icons
⛔ Show the CONCEPTS from the text, not just scales/gavels
⛔ Visual elements must reflect the actual legal topic described
⛔ The image must be 100% wordless

Output: A conceptual illustration of the specific legal topic described.`
    }

    console.log('Gerando imagem com Gemini API direta...')

    // Chamar API direta do Gemini
    const aiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=${DIREITO_PREMIUM_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          responseModalities: ["TEXT", "IMAGE"]
        }
      })
    })

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text()
      console.error('Erro na API Gemini:', aiResponse.status, errorText)
      throw new Error(`Erro na geração de imagem: ${aiResponse.status}`)
    }

    const aiData = await aiResponse.json()
    console.log('Resposta Gemini recebida')

    // Extrair imagem base64 da resposta nativa do Gemini
    const parts = aiData.candidates?.[0]?.content?.parts || []
    const imagePart = parts.find((p: any) => p.inlineData?.data)
    const base64Data = imagePart?.inlineData?.data

    if (!base64Data) {
      console.error('Resposta sem imagem:', JSON.stringify(aiData).substring(0, 500))
      throw new Error('Nenhuma imagem gerada na resposta')
    }

    // Converter base64 para Uint8Array
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
