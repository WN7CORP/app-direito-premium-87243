import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Gerar prompt de imagem usando Gemini TEXT
async function gerarPromptComIA(conteudo: string, tipo: string, area: string, tema: string, apiKey: string): Promise<string> {
  const textoLimitado = conteudo.substring(0, 2500)
  
  const promptParaGerarPrompt = `You are a master at creating prompts for generating beautiful, clean, minimalist educational illustrations.

CONTEXT:
- Legal Area: ${area}
- Topic: ${tema}
- Content Type: ${tipo.startsWith('exemplo') ? 'A practical case study with characters and a story' : 'An abstract legal concept that needs visual representation'}

CONTENT TO ILLUSTRATE:
${textoLimitado}

YOUR TASK:
Create an image generation prompt that will produce a BEAUTIFUL, CLEAN, MODERN illustration.

STYLE TO REQUEST (MANDATORY - include these exact specifications):
- Style: Modern flat illustration, soft pastel colors, warm tones
- Background: Soft gradient from light beige to cream
- Characters: Simple, friendly human figures with minimal facial features (just dots for eyes, simple curved line for smile)
- Objects: Rounded corners, soft shadows, clean geometric shapes
- Composition: Balanced, centered, with breathing room
- Colors: Muted pastels - soft coral, sage green, dusty blue, warm cream, soft peach
- NO OUTLINES - use color blocks and soft shadows only
- Think: Headspace app, Notion illustrations, Slack empty states

FOR PRACTICAL CASES (examples):
- Show 2-3 simple human figures in a scene
- Use visual storytelling: who is doing what to whom
- Show the conflict or situation with body language and positioning
- Add relevant objects (documents, buildings, vehicles) in simple geometric style

FOR CONCEPTS (resumo):
- Use visual metaphors: scales = balance/justice, bridges = connection, shields = protection
- Show abstract relationships with simple arrows or connecting lines
- Create a centered, icon-like composition
- Think: app onboarding illustrations

ABSOLUTE PROHIBITIONS (CRITICAL):
1. NO TEXT of any kind - no words, letters, labels, numbers, captions
2. NO realistic faces - only simple dots/circles for features
3. NO complex details - keep everything minimal and clean
4. NO harsh colors - only soft, muted tones
5. NO busy compositions - maximum 3-4 main elements

OUTPUT:
Write ONLY the image prompt in English. No explanations, no quotes, just the prompt itself.
Start directly with "A soft, modern flat illustration showing..."`

  console.log('Etapa 1: Gerando prompt com Gemini TEXT...')

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: promptParaGerarPrompt }] }],
      generationConfig: {
        temperature: 0.9,
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

CRITICAL REQUIREMENTS:
- Absolutely NO text, words, letters, numbers, labels or any written content in the image
- Modern flat illustration style with soft pastel colors
- Clean, minimal, professional appearance
- Warm, friendly, educational feeling`

    console.log('Etapa 2: Gerando imagem...')

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
