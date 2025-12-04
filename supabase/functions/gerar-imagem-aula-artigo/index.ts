import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Função para gerar prompt contextualizado com IA (Gemini TEXT)
async function gerarPromptComIA(
  conteudo: string, 
  tipo: 'storytelling' | 'exemplo',
  personagem: string | undefined,
  contexto: string | undefined,
  numeroArtigo: string,
  codigoTabela: string,
  apiKey: string
): Promise<string> {
  const textoLimitado = conteudo.substring(0, 2500)
  
  const tipoDescricao = tipo === 'storytelling' 
    ? 'uma HISTÓRIA NARRATIVA com personagens que ilustra um conceito jurídico'
    : 'um EXEMPLO PRÁTICO de aplicação do artigo na vida real'
  
  const promptParaGerarPrompt = `You are an expert visual storyteller who creates detailed prompts for cartoon illustrations that SPECIFICALLY represent legal educational content.

LEGAL CONTEXT:
- Law Code: ${codigoTabela}
- Article Number: ${numeroArtigo}
- Content Type: ${tipoDescricao}
${personagem ? `- Main Character: ${personagem}` : ''}
${contexto ? `- Context: ${contexto}` : ''}

CONTENT TO ILLUSTRATE:
${textoLimitado}

YOUR MISSION:
Analyze this educational content carefully and create an image prompt that TELLS THIS EXACT STORY visually. Extract:
1. WHO are the specific characters? (names, roles, relationships mentioned in the text)
2. WHAT is the specific situation/scenario happening?
3. WHERE does it take place? (specific setting - home, office, court, street, etc.)
4. WHAT objects or elements are key to understanding the scene?
5. WHAT emotion or moment captures the essence of this legal lesson?

MANDATORY STYLE - MODERN CARTOON:
- Style: Clean modern cartoon illustration, similar to Duolingo, Headspace, or explainer videos
- Format: HORIZONTAL 16:9 landscape
- Characters: Expressive cartoon characters with distinct features, showing clear emotions
- Colors: Vibrant but harmonious palette, warm and inviting
- Background: Simple but contextual environment 
- Mood: Educational and clear, making the legal concept easy to understand visually

STORYTELLING REQUIREMENTS:
- Show the EXACT scenario described in the content, not a generic scene
- If there are multiple people interacting, show their dynamic
- Include visual elements that represent the specific legal concept
- Use body language and facial expressions to convey the situation
- Add contextual props that are mentioned or implied

CHARACTER REPRESENTATION:
${personagem === 'Maria' ? '- Maria: Young professional woman, confident, dark hair, wearing modern business casual' : ''}
${personagem === 'João' ? '- João: Middle-aged businessman, slightly stressed, wearing suit or business casual' : ''}
${personagem === 'Pedro' ? '- Pedro: Regular citizen, casual clothing, relatable everyday person' : ''}
${personagem === 'Ana' ? '- Ana: Professional woman with authority, could be a judge or lawyer, formal attire' : ''}
${personagem === 'Carlos' ? '- Carlos: Young law student, eager to learn, casual but neat' : ''}

ABSOLUTE RULES:
1. IF ANY TEXT IS NEEDED IN THE IMAGE (signs, banners, documents, labels, buildings), IT MUST BE IN BRAZILIAN PORTUGUESE - WRITE IN UPPERCASE IN YOUR PROMPT:
   - "TRIBUNAL" (not "COURT")
   - "ESCRITÓRIO" (not "OFFICE")  
   - "CONTRATO" (not "CONTRACT")
   - "ADVOGADO" (not "LAWYER")
   - "JUIZ" (not "JUDGE")
   - "POLÍCIA" (not "POLICE")
   - "DELEGACIA" (not "POLICE STATION")
   - "CARTÓRIO" (not "NOTARY")
   - "FÓRUM" (not "FORUM/COURTHOUSE")
   - "PREFEITURA" (not "CITY HALL")
   - "BANCO" (not "BANK")
   - "HOSPITAL" (not "HOSPITAL" - this one is the same)
   - "ESCOLA" (not "SCHOOL")
   - "LOJA" (not "STORE")
   - "MERCADO" (not "MARKET")

2. NEVER use English text in the image - ALL visible text must be in BRAZILIAN PORTUGUESE and UPPERCASE
3. NO graphic violence or inappropriate content
4. Characters must look like distinct Brazilian individuals
5. Scene must be SPECIFIC to this content, not a generic illustration
6. Show the KEY MOMENT that best represents the legal concept being taught

OUTPUT:
Write ONLY the detailed image prompt. No explanations.
Start with: "A colorful cartoon illustration in 16:9 horizontal format showing..."`

  console.log('[gerar-imagem-aula-artigo] Gerando prompt para:', tipo, personagem || 'sem personagem')

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
    console.error('[gerar-imagem-aula-artigo] Erro Gemini:', response.status, errorText)
    throw new Error(`Erro ao gerar prompt: ${response.status}`)
  }

  const data = await response.json()
  const promptGerado = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || ''
  
  if (!promptGerado) {
    throw new Error('Prompt vazio retornado pela IA')
  }
  
  console.log('[gerar-imagem-aula-artigo] Prompt gerado:', promptGerado.substring(0, 300))
  return promptGerado
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { 
      aulaId,
      secaoId,
      slideIndex,
      conteudo,
      tipo,
      personagem,
      contexto,
      numeroArtigo,
      codigoTabela
    } = await req.json()

    if (!conteudo || !tipo || !numeroArtigo || !codigoTabela) {
      throw new Error('conteudo, tipo, numeroArtigo e codigoTabela são obrigatórios')
    }

    console.log(`[gerar-imagem-aula-artigo] Gerando imagem para Art. ${numeroArtigo} - Tipo: ${tipo}, Seção: ${secaoId}, Slide: ${slideIndex}`)

    const DIREITO_PREMIUM_API_KEY = Deno.env.get('DIREITO_PREMIUM_API_KEY')
    if (!DIREITO_PREMIUM_API_KEY) {
      throw new Error('DIREITO_PREMIUM_API_KEY não configurado')
    }

    // 1. Gerar prompt contextualizado com IA
    console.log('[gerar-imagem-aula-artigo] Etapa 1: Gerando prompt com Gemini...')
    const promptEspecifico = await gerarPromptComIA(
      conteudo,
      tipo as 'storytelling' | 'exemplo',
      personagem,
      contexto,
      numeroArtigo,
      codigoTabela,
      DIREITO_PREMIUM_API_KEY
    )

    // 2. Gerar imagem com Nano Banana (Gemini Image Generation)
    const promptFinal = `${promptEspecifico}

CRITICAL STYLE REQUIREMENTS:
- Modern colorful cartoon illustration
- Clean lines, expressive characters  
- 16:9 horizontal landscape format
- Vibrant colors, simple backgrounds
- Educational explainer style like Duolingo, Headspace, or TED-Ed
- Characters should look Brazilian/Latin American

CRITICAL LANGUAGE: 
- IF there is ANY text visible in the image (on signs, buildings, documents, uniforms, papers, screens, etc.), it MUST be in BRAZILIAN PORTUGUESE
- Write all text in UPPERCASE: "TRIBUNAL", "ADVOGADO", "CONTRATO", "ESCRITÓRIO", "JUIZ", etc.
- NEVER use English text anywhere in the image

High quality render, professional illustration.`

    console.log('[gerar-imagem-aula-artigo] Etapa 2: Gerando imagem com Gemini Image Generation...')

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
      console.error('[gerar-imagem-aula-artigo] Erro na API Gemini Image:', aiResponse.status, errorText)
      throw new Error(`Erro na geração de imagem: ${aiResponse.status}`)
    }

    const aiData = await aiResponse.json()
    console.log('[gerar-imagem-aula-artigo] Resposta Gemini recebida')

    const parts = aiData.candidates?.[0]?.content?.parts || []
    const imagePart = parts.find((p: any) => p.inlineData?.data)
    const base64Data = imagePart?.inlineData?.data

    if (!base64Data) {
      console.error('[gerar-imagem-aula-artigo] Resposta sem imagem:', JSON.stringify(aiData).substring(0, 500))
      throw new Error('Nenhuma imagem gerada na resposta')
    }

    // 3. Converter base64
    const binaryString = atob(base64Data)
    const uint8Array = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      uint8Array[i] = binaryString.charCodeAt(i)
    }

    console.log(`[gerar-imagem-aula-artigo] Imagem gerada, tamanho: ${uint8Array.length} bytes`)

    // 4. Upload para Catbox
    console.log('[gerar-imagem-aula-artigo] Fazendo upload para Catbox...')
    const formData = new FormData()
    formData.append('reqtype', 'fileupload')
    formData.append('fileToUpload', new Blob([uint8Array], { type: 'image/png' }), `aula_${numeroArtigo}_${tipo}_${secaoId || 0}_${slideIndex || 0}_${Date.now()}.png`)

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

    console.log(`[gerar-imagem-aula-artigo] Upload Catbox sucesso: ${imageUrl}`)

    return new Response(
      JSON.stringify({ 
        url_imagem: imageUrl, 
        tipo,
        secaoId,
        slideIndex
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('[gerar-imagem-aula-artigo] Erro:', error)
    return new Response(
      JSON.stringify({ error: 'Erro ao gerar imagem', details: error?.message || 'Erro desconhecido' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
