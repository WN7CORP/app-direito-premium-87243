import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Função para gerar prompt contextualizado com IA (Gemini TEXT)
async function gerarPromptComIA(exemploTexto: string, area: string, tema: string, apiKey: string): Promise<string> {
  const textoLimitado = exemploTexto.substring(0, 2000)
  
  const promptParaGerarPrompt = `You are an expert at creating prompts for professional, polished 3D illustrations.

CONTEXT:
- Legal Area: ${area}
- Topic: ${tema}
- Content Type: A practical case study - show a scene with characters

CONTENT TO ILLUSTRATE:
${textoLimitado}

YOUR TASK:
Create an image generation prompt for a PROFESSIONAL, POLISHED, HIGH-QUALITY 3D illustration in VERTICAL format (9:16 portrait).

MANDATORY STYLE SPECIFICATIONS:
- Style: Professional 3D isometric illustration, Blender-quality render
- Orientation: VERTICAL PORTRAIT (9:16 aspect ratio)
- Lighting: Soft studio lighting with subtle shadows
- Colors: Corporate color palette - deep blues, teals, warm oranges, clean whites
- Characters: Stylized 3D human figures (like Pixar style but simpler), professional appearance, Brazilian diversity
- Objects: Clean 3D models with smooth surfaces, subtle gradients, slight glossy finish
- Background: Clean gradient background (light blue to white, or soft gray gradient)
- Quality: Ultra high definition, professional marketing quality
- Think: Stripe, Linear, or Notion marketing illustrations

FOR THIS CASE STUDY:
- Show 2-3 professional 3D characters in a business/legal scene
- Include relevant 3D objects: documents, buildings, computers, courtrooms
- Use body language and positioning to tell the story
- Professional corporate setting

VERTICAL COMPOSITION (9:16):
- Top third: sky/environment/context
- Middle third: characters and main action
- Bottom third: supporting elements/ground

ABSOLUTE PROHIBITIONS:
1. NO TEXT - no words, letters, labels, numbers, captions, signs with writing
2. NO hand-drawn or sketch style - must look professionally rendered
3. NO flat 2D style - must be 3D with depth and lighting
4. NO cartoon or childish style - professional corporate aesthetic
5. NO busy or cluttered compositions - clean and focused

OUTPUT:
Write ONLY the image prompt. No explanations, no quotes.
Start with: "A professional 3D isometric vertical illustration showing..."`

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: promptParaGerarPrompt }] }],
      generationConfig: {
        temperature: 0.8,
        maxOutputTokens: 700
      }
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('[gerar-imagem-exemplo] Erro Gemini:', response.status, errorText)
    throw new Error(`Erro ao gerar prompt: ${response.status}`)
  }

  const data = await response.json()
  const promptGerado = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || ''
  
  if (!promptGerado) {
    throw new Error('Prompt vazio retornado pela IA')
  }
  
  console.log('[gerar-imagem-exemplo] Prompt gerado:', promptGerado.substring(0, 400))
  return promptGerado
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { questaoId, exemploTexto, area, tema } = await req.json()

    if (!questaoId || !exemploTexto) {
      throw new Error('questaoId e exemploTexto são obrigatórios')
    }

    console.log(`[gerar-imagem-exemplo] Processando questão ${questaoId} - Área: ${area || 'N/A'}, Tema: ${tema || 'N/A'}`)

    const DIREITO_PREMIUM_API_KEY = Deno.env.get('DIREITO_PREMIUM_API_KEY')
    if (!DIREITO_PREMIUM_API_KEY) {
      throw new Error('DIREITO_PREMIUM_API_KEY não configurado')
    }

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

    // 2. Gerar prompt contextualizado com IA
    console.log('[gerar-imagem-exemplo] Etapa 1: Gerando prompt com Gemini...')
    const promptEspecifico = await gerarPromptComIA(
      exemploTexto,
      area || 'Direito',
      tema || 'Questão jurídica',
      DIREITO_PREMIUM_API_KEY
    )

    // 3. Gerar imagem com Nano Banana (Gemini Image Generation)
    const promptFinal = `${promptEspecifico}

CRITICAL: This must be a professional 3D rendered illustration in VERTICAL PORTRAIT format (9:16 aspect ratio). Studio lighting. NO text, words, letters, or numbers anywhere in the image. Ultra high quality, corporate marketing style. Clean gradient background.`

    console.log('[gerar-imagem-exemplo] Etapa 2: Gerando imagem com Nano Banana...')

    const aiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=${DIREITO_PREMIUM_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: promptFinal }] }],
        generationConfig: {
          responseModalities: ["TEXT", "IMAGE"]
        }
      })
    })

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text()
      console.error('[gerar-imagem-exemplo] Erro na API Gemini Image:', aiResponse.status, errorText)
      throw new Error(`Erro na geração de imagem: ${aiResponse.status}`)
    }

    const aiData = await aiResponse.json()
    console.log('[gerar-imagem-exemplo] Resposta Gemini recebida')

    const parts = aiData.candidates?.[0]?.content?.parts || []
    const imagePart = parts.find((p: any) => p.inlineData?.data)
    const base64Data = imagePart?.inlineData?.data

    if (!base64Data) {
      console.error('[gerar-imagem-exemplo] Resposta sem imagem:', JSON.stringify(aiData).substring(0, 500))
      throw new Error('Nenhuma imagem gerada na resposta')
    }

    // 4. Converter base64
    const binaryString = atob(base64Data)
    const uint8Array = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      uint8Array[i] = binaryString.charCodeAt(i)
    }

    console.log(`[gerar-imagem-exemplo] Imagem gerada, tamanho: ${uint8Array.length} bytes`)

    // 5. Upload para Catbox
    console.log('[gerar-imagem-exemplo] Fazendo upload para Catbox...')
    const formData = new FormData()
    formData.append('reqtype', 'fileupload')
    formData.append('fileToUpload', new Blob([uint8Array], { type: 'image/png' }), `exemplo_${questaoId}_${Date.now()}.png`)

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

    // 6. Salvar URL no banco
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
