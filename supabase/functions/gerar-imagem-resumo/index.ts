import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Gerar prompt de imagem usando Gemini TEXT
async function gerarPromptComIA(conteudo: string, tipo: string, area: string, tema: string, apiKey: string): Promise<string> {
  const textoLimitado = conteudo.substring(0, 2500)
  
  const promptParaGerarPrompt = `You are an expert at creating prompts for professional, polished 3D illustrations.

CONTEXT:
- Legal Area: ${area}
- Topic: ${tema}
- Content Type: ${tipo.startsWith('exemplo') ? 'A practical case study - show a scene with characters' : 'An abstract legal concept - show a symbolic visual metaphor'}

CONTENT TO ILLUSTRATE:
${textoLimitado}

YOUR TASK:
Create an image generation prompt for a PROFESSIONAL, POLISHED, HIGH-QUALITY 3D illustration.

MANDATORY STYLE SPECIFICATIONS:
- Style: Professional 3D isometric illustration, Blender-quality render
- Lighting: Soft studio lighting with subtle shadows
- Colors: Corporate color palette - deep blues, teals, warm oranges, clean whites
- Characters: Stylized 3D human figures (like Pixar style but simpler), professional appearance
- Objects: Clean 3D models with smooth surfaces, subtle gradients, slight glossy finish
- Background: Clean gradient background (light blue to white, or soft gray gradient)
- Quality: Ultra high definition, professional marketing quality
- Think: Stripe, Linear, or Notion marketing illustrations

FOR CASE STUDIES (exemplo):
- Show 2-3 professional 3D characters in a business/legal scene
- Include relevant 3D objects: documents, buildings, computers, courtrooms
- Use body language and positioning to tell the story
- Professional corporate setting

FOR CONCEPTS (resumo):
- Create a powerful 3D symbolic composition
- Use iconic legal symbols rendered in 3D: scales of justice, gavels, shields, documents
- Create a centered, hero-image style composition
- Add subtle floating elements for depth

ABSOLUTE PROHIBITIONS:
1. NO TEXT - no words, letters, labels, numbers, captions, signs with writing
2. NO hand-drawn or sketch style - must look professionally rendered
3. NO flat 2D style - must be 3D with depth and lighting
4. NO cartoon or childish style - professional corporate aesthetic
5. NO busy or cluttered compositions - clean and focused

OUTPUT:
Write ONLY the image prompt. No explanations, no quotes.
Start with: "A professional 3D isometric illustration showing..."`

  console.log('Etapa 1: Gerando prompt profissional...')

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
    console.error('Erro ao gerar prompt:', response.status, errorText)
    throw new Error(`Erro na geração do prompt: ${response.status}`)
  }

  const data = await response.json()
  const promptGerado = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim()

  if (!promptGerado) {
    throw new Error('Nenhum prompt gerado pela IA')
  }

  console.log('Prompt gerado:', promptGerado.substring(0, 400))
  return promptGerado
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

    // Verificar cache
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

    // ETAPA 1: Gerar prompt específico
    const promptEspecifico = await gerarPromptComIA(
      conteudo, 
      tipo, 
      area || 'Direito', 
      tema || 'Tema jurídico', 
      DIREITO_PREMIUM_API_KEY
    )

    // ETAPA 2: Gerar imagem com Nano Banana
    const promptFinal = `${promptEspecifico}

CRITICAL: This must be a professional 3D rendered illustration with studio lighting. NO text, words, letters, or numbers anywhere in the image. Ultra high quality, corporate marketing style. Clean gradient background.`

    console.log('Etapa 2: Gerando imagem profissional...')

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
      console.error('Erro na API Gemini Image:', aiResponse.status, errorText)
      throw new Error(`Erro na geração de imagem: ${aiResponse.status}`)
    }

    const aiData = await aiResponse.json()
    console.log('Resposta Gemini recebida')

    const parts = aiData.candidates?.[0]?.content?.parts || []
    const imagePart = parts.find((p: any) => p.inlineData?.data)
    const base64Data = imagePart?.inlineData?.data

    if (!base64Data) {
      console.error('Resposta sem imagem:', JSON.stringify(aiData).substring(0, 500))
      throw new Error('Nenhuma imagem gerada na resposta')
    }

    // Converter base64
    const binaryString = atob(base64Data)
    const uint8Array = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      uint8Array[i] = binaryString.charCodeAt(i)
    }

    // Upload para Catbox
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

    // Salvar URL
    const updateData: Record<string, string> = {}
    updateData[coluna] = imageUrl

    const { error: updateError } = await supabase
      .from('RESUMO')
      .update(updateData)
      .eq('id', resumoId)

    if (updateError) {
      console.error('Erro ao salvar URL:', updateError)
    } else {
      console.log('URL salva com sucesso')
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
