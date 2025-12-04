import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Função para gerar prompt de imagem usando Gemini TEXT
async function gerarPromptComIA(conteudo: string, tipo: string, area: string, tema: string, apiKey: string): Promise<string> {
  const textoLimitado = conteudo.substring(0, 2000)
  
  const instrucaoTipo = tipo.startsWith('exemplo') 
    ? `Crie uma CENA NARRATIVA visual mostrando os personagens e a situação descrita. 
       Foque em: quem são as pessoas, o que estão fazendo, onde estão, qual é o conflito/problema.
       Exemplo: "Uma mulher com dois filhos pequenos pega pães de uma prateleira enquanto o padeiro observa"`
    : `Crie um DIAGRAMA CONCEITUAL visual mostrando as relações entre os conceitos jurídicos.
       Foque em: símbolos abstratos, setas conectando ideias, hierarquias visuais.
       Exemplo: "Diagrama mostrando três círculos conectados por setas: Conduta → Resultado → Nexo Causal"`

  const promptParaGerarPrompt = `Você é um especialista em criar prompts de imagem educacionais.
Analise o texto jurídico abaixo e crie um PROMPT DE IMAGEM em inglês para ilustrá-lo.

ÁREA: ${area}
TEMA: ${tema}
TIPO DE ILUSTRAÇÃO: ${tipo.startsWith('exemplo') ? 'Cena narrativa (caso prático)' : 'Diagrama conceitual'}

TEXTO PARA ANALISAR:
${textoLimitado}

INSTRUÇÕES PARA O PROMPT:
${instrucaoTipo}

REGRAS OBRIGATÓRIAS DO PROMPT:
1. Descreva personagens como "stick figures" simples
2. Descreva objetos e cenários de forma básica
3. Estilo OBRIGATÓRIO: "Simple hand-drawn sketch, black ink lines on cream/beige paper background"
4. PROIBIDO: qualquer texto, palavras, letras, números, rótulos ou legendas na imagem
5. Use setas e símbolos visuais para mostrar relações
6. Formato: paisagem 16:9
7. Mantenha a ilustração simples e educacional

Retorne APENAS o prompt em inglês, sem explicações, sem aspas, direto o texto do prompt.`

  console.log('Etapa 1: Gerando prompt específico com Gemini TEXT...')

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: promptParaGerarPrompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 500
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

  console.log('Prompt gerado:', promptGerado.substring(0, 200) + '...')
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

    // ========== ETAPA 1: Gerar prompt específico com Gemini TEXT ==========
    const promptEspecifico = await gerarPromptComIA(
      conteudo, 
      tipo, 
      area || 'Direito', 
      tema || 'Tema jurídico', 
      DIREITO_PREMIUM_API_KEY
    )

    // ========== ETAPA 2: Gerar imagem com Nano Banana ==========
    const promptFinal = `${promptEspecifico}

CRITICAL STYLE REQUIREMENTS:
- Simple hand-drawn sketch style
- Black ink lines on cream/beige paper background
- Educational and friendly appearance
- Wide 16:9 landscape format
- DO NOT include ANY text, words, letters, numbers, labels, or captions in the image. ONLY drawings.`

    console.log('Etapa 2: Gerando imagem com Nano Banana...')

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
    console.log('Resposta Nano Banana recebida')

    // Extrair imagem base64 da resposta
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
