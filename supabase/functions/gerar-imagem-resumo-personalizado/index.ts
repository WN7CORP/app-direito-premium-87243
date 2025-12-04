import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Função para gerar prompt contextualizado com IA (Gemini TEXT) - Mesmo estilo das questões
async function gerarPromptComIA(resumoTexto: string, titulo: string, apiKey: string): Promise<string> {
  const textoLimitado = resumoTexto.substring(0, 2000)
  
  const promptParaGerarPrompt = `You are an expert visual storyteller who creates detailed prompts for cartoon illustrations that SPECIFICALLY represent legal case studies.

LEGAL CONTEXT:
- Topic: ${titulo || 'Conceito Jurídico'}

LEGAL CONTENT TO ILLUSTRATE:
${textoLimitado}

YOUR MISSION:
Analyze this legal content carefully and create an image prompt that TELLS THIS STORY visually. Extract:
1. WHO are the specific characters? (lawyers, judges, citizens, government officials, companies)
2. WHAT is the specific action/situation happening?
3. WHERE does it take place? (specific setting)
4. WHAT objects or elements are key to understanding the concept?

MANDATORY STYLE - MODERN CARTOON:
- Style: Clean modern cartoon illustration, similar to Duolingo, Headspace, or explainer videos
- Format: HORIZONTAL 16:9 landscape
- Characters: Expressive cartoon characters with distinct features, showing clear emotions
- Colors: Vibrant but harmonious palette, warm and inviting
- Background: Simple but contextual environment (home, office, church, courthouse, street)
- Mood: Educational and clear, making the legal situation easy to understand

STORYTELLING REQUIREMENTS:
- Show the EXACT scenario from the content, not a generic scene
- If there are multiple parties, show the dynamic between them
- Include visual elements that represent the specific legal issue
- Use body language and facial expressions to convey the situation
- Add contextual props that are mentioned or implied in the content

EXAMPLES OF SPECIFIC SCENES:
- For administrative law: Show a government building with officials making decisions
- For contract law: Show parties signing documents or negotiating
- For constitutional rights: Show citizens exercising or protecting their rights
- For criminal law: Show the confrontation (non-graphic) with clear victim/perpetrator
- For labor law: Show workplace situations with employees and employers

ABSOLUTE RULES:
1. IF ANY TEXT IS NEEDED IN THE IMAGE (signs, banners, documents, labels), IT MUST BE IN PORTUGUESE - WRITE IN UPPERCASE: "TRIBUNAL", "POLÍCIA", "DELEGACIA", "PRISÃO", "FÓRUM", "CONTRATO", "ESCRITÓRIO", "BANCO", "HOSPITAL", "PREFEITURA", "JUSTIÇA", "LEI", "ADVOGADO", etc.
2. NEVER use English text in the image - ALL text must be in BRAZILIAN PORTUGUESE
3. NO graphic violence or blood
4. NO inappropriate content
5. Characters must look like distinct individuals, not generic people
6. Scene must be SPECIFIC to this content, not a generic legal illustration

IMPORTANT LANGUAGE RULE:
- Any visible text on buildings, signs, documents, uniforms, or objects MUST be in PORTUGUESE
- Examples: "COURT" should be "TRIBUNAL", "POLICE" should be "POLÍCIA", "PRISON" should be "PRISÃO", "LAWYER" should be "ADVOGADO"
- Write the Portuguese text in UPPERCASE in your prompt so the image model understands it must be in Portuguese

OUTPUT:
Write ONLY the detailed image prompt. No explanations.
Start with: "A colorful cartoon illustration in 16:9 format showing..."`

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: promptParaGerarPrompt }] }],
      generationConfig: {
        temperature: 0.9,
        maxOutputTokens: 800
      }
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('[gerar-imagem-resumo-personalizado] Erro Gemini:', response.status, errorText)
    throw new Error(`Erro ao gerar prompt: ${response.status}`)
  }

  const data = await response.json()
  const promptGerado = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || ''
  
  if (!promptGerado) {
    throw new Error('Prompt vazio retornado pela IA')
  }
  
  console.log('[gerar-imagem-resumo-personalizado] Prompt gerado:', promptGerado.substring(0, 400))
  return promptGerado
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { resumoTexto, titulo } = await req.json()

    if (!resumoTexto) {
      throw new Error('resumoTexto é obrigatório')
    }

    console.log(`[gerar-imagem-resumo-personalizado] Processando resumo - Título: ${titulo || 'N/A'}`)

    const DIREITO_PREMIUM_API_KEY = Deno.env.get('DIREITO_PREMIUM_API_KEY')
    if (!DIREITO_PREMIUM_API_KEY) {
      throw new Error('DIREITO_PREMIUM_API_KEY não configurado')
    }

    // 1. Gerar prompt contextualizado com IA (mesmo estilo das questões)
    console.log('[gerar-imagem-resumo-personalizado] Etapa 1: Gerando prompt com Gemini...')
    const promptEspecifico = await gerarPromptComIA(resumoTexto, titulo || '', DIREITO_PREMIUM_API_KEY)

    // 2. Gerar imagem com Nano Banana (Gemini Image Generation) - Mesmo estilo das questões
    const promptFinal = `${promptEspecifico}

CRITICAL STYLE: Modern colorful cartoon illustration, clean lines, expressive characters, 16:9 horizontal format. Vibrant colors, simple backgrounds, educational explainer style like Duolingo or Headspace. 
CRITICAL LANGUAGE: IF there is ANY text visible in the image (on signs, buildings, documents, uniforms), it MUST be in BRAZILIAN PORTUGUESE, written in UPPERCASE. Example: "TRIBUNAL" not "COURT", "POLÍCIA" not "POLICE", "DELEGACIA" not "POLICE STATION".
High quality render.`

    console.log('[gerar-imagem-resumo-personalizado] Etapa 2: Gerando imagem com Gemini...')

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
      console.error('[gerar-imagem-resumo-personalizado] Erro na API Gemini Image:', aiResponse.status, errorText)
      throw new Error(`Erro na geração de imagem: ${aiResponse.status}`)
    }

    const aiData = await aiResponse.json()
    console.log('[gerar-imagem-resumo-personalizado] Resposta Gemini recebida')

    const parts = aiData.candidates?.[0]?.content?.parts || []
    const imagePart = parts.find((p: any) => p.inlineData?.data)
    const base64Data = imagePart?.inlineData?.data

    if (!base64Data) {
      console.error('[gerar-imagem-resumo-personalizado] Resposta sem imagem:', JSON.stringify(aiData).substring(0, 500))
      throw new Error('Nenhuma imagem gerada na resposta')
    }

    // 3. Converter base64
    const binaryString = atob(base64Data)
    const uint8Array = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      uint8Array[i] = binaryString.charCodeAt(i)
    }

    console.log(`[gerar-imagem-resumo-personalizado] Imagem gerada, tamanho: ${uint8Array.length} bytes`)

    // 4. Upload para Catbox
    console.log('[gerar-imagem-resumo-personalizado] Fazendo upload para Catbox...')
    const formData = new FormData()
    formData.append('reqtype', 'fileupload')
    formData.append('fileToUpload', new Blob([uint8Array], { type: 'image/png' }), `resumo_personalizado_${Date.now()}.png`)

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

    console.log(`[gerar-imagem-resumo-personalizado] Upload Catbox sucesso: ${imageUrl}`)

    return new Response(
      JSON.stringify({ url_imagem: imageUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('[gerar-imagem-resumo-personalizado] Erro:', error)
    return new Response(
      JSON.stringify({ error: 'Erro ao gerar imagem', details: error?.message || 'Erro desconhecido' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
