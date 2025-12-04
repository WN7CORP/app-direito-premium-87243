import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Função para gerar prompt contextualizado com IA (Gemini TEXT)
async function gerarPromptComIA(exemploTexto: string, area: string, tema: string, apiKey: string): Promise<string> {
  const textoLimitado = exemploTexto.substring(0, 2000)
  
  const promptParaGerarPrompt = `You are an expert visual storyteller who creates detailed prompts for cartoon illustrations that SPECIFICALLY represent legal case studies.

LEGAL CONTEXT:
- Area: ${area}
- Topic: ${tema}

CASE STUDY TO ILLUSTRATE:
${textoLimitado}

YOUR MISSION:
Analyze this case study carefully and create an image prompt that TELLS THIS EXACT STORY visually. Extract:
1. WHO are the specific characters? (names, roles, relationships)
2. WHAT is the specific action/crime/situation happening?
3. WHERE does it take place? (specific setting)
4. WHAT objects or elements are key to understanding the case?

MANDATORY STYLE - MODERN CARTOON:
- Style: Clean modern cartoon illustration, similar to Duolingo, Headspace, or explainer videos
- Format: HORIZONTAL 16:9 landscape
- Characters: Expressive cartoon characters with distinct features, showing clear emotions
- Colors: Vibrant but harmonious palette, warm and inviting
- Background: Simple but contextual environment (home, office, church, courthouse, street)
- Mood: Educational and clear, making the legal situation easy to understand

STORYTELLING REQUIREMENTS:
- Show the EXACT scenario from the case study, not a generic scene
- If there's a victim and perpetrator, show the dynamic between them
- Include visual elements that represent the specific crime or legal issue
- Use body language and facial expressions to convey the situation
- Add contextual props that are mentioned or implied in the case

EXAMPLES OF SPECIFIC SCENES:
- For bigamy: Show the wedding ceremony with the second spouse while the first watches
- For fraud: Show the deception moment with the victim being tricked
- For theft: Show the exact item being taken in the specific context
- For assault: Show the confrontation (non-graphic) with clear aggressor/victim

ABSOLUTE RULES:
1. IF ANY TEXT IS NEEDED IN THE IMAGE (signs, banners, documents, labels), IT MUST BE IN PORTUGUESE - WRITE IN UPPERCASE: "TRIBUNAL", "POLÍCIA", "DELEGACIA", "PRISÃO", "FÓRUM", "CONTRATO", "ESCRITÓRIO", "BANCO", "HOSPITAL", etc.
2. NEVER use English text in the image - ALL text must be in BRAZILIAN PORTUGUESE
3. NO graphic violence or blood
4. NO inappropriate content
5. Characters must look like distinct individuals, not generic people
6. Scene must be SPECIFIC to this case, not a generic legal illustration

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

CRITICAL STYLE: Modern colorful cartoon illustration, clean lines, expressive characters, 16:9 horizontal format. Vibrant colors, simple backgrounds, educational explainer style like Duolingo or Headspace. 
CRITICAL LANGUAGE: IF there is ANY text visible in the image (on signs, buildings, documents, uniforms), it MUST be in BRAZILIAN PORTUGUESE, written in UPPERCASE. Example: "TRIBUNAL" not "COURT", "POLÍCIA" not "POLICE", "DELEGACIA" not "POLICE STATION".
High quality render.`

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
