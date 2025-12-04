import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { HfInference } from 'https://esm.sh/@huggingface/inference@3.9.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Função para gerar prompt contextualizado com IA (Gemini)
async function gerarPromptComIA(exemploTexto: string, area: string, tema: string, apiKey: string): Promise<string> {
  const textoLimitado = exemploTexto.substring(0, 2000)
  
  const promptParaGerarPrompt = `Você é especialista em criar prompts para ilustrações jurídicas profissionais.

CONTEXTO:
- Área do Direito: ${area}
- Tema da Questão: ${tema}
- Tipo: Exemplo prático de uma questão jurídica

EXEMPLO PRÁTICO A ILUSTRAR:
${textoLimitado}

SUA TAREFA:
Crie um prompt em INGLÊS para gerar uma ilustração 3D profissional que represente visualmente este exemplo prático.

ESPECIFICAÇÕES OBRIGATÓRIAS:
- Estilo: Ilustração 3D isométrica profissional, qualidade de render Blender
- Iluminação: Suave de estúdio com sombras sutis
- Cores: Paleta corporativa - azuis profundos, verdes-azulados, laranjas quentes, brancos limpos
- Personagens: Figuras humanas 3D estilizadas (estilo Pixar simplificado), aparência profissional brasileira
- Objetos: Modelos 3D limpos com superfícies suaves, gradientes sutis
- Fundo: Gradiente limpo (azul claro para branco)

ANÁLISE DO EXEMPLO:
1. Identifique os PERSONAGENS principais (réu, vítima, juiz, advogado, testemunha, policial, etc.)
2. Identifique o CENÁRIO (tribunal, delegacia, escritório, rua, residência, banco, etc.)
3. Identifique OBJETOS relevantes (documentos, arma, veículo, dinheiro, celular, contrato, etc.)
4. Identifique a AÇÃO principal sendo representada (roubo, julgamento, negociação, prisão, etc.)

PROIBIÇÕES ABSOLUTAS:
1. SEM TEXTO - nenhuma palavra, letra, número, legenda, placa
2. SEM estilo de desenho à mão - deve parecer renderizado profissionalmente
3. SEM estilo 2D flat - deve ser 3D com profundidade e iluminação
4. SEM estilo cartoon ou infantil - estética corporativa profissional
5. SEM sangue, violência gráfica ou conteúdo perturbador

OUTPUT:
Escreva APENAS o prompt da imagem em inglês, máximo 400 caracteres. Sem explicações.
Comece com: "A professional 3D isometric illustration showing..."`

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
    console.error('[gerar-imagem-exemplo] Erro Gemini:', response.status, errorText)
    throw new Error(`Erro ao gerar prompt: ${response.status}`)
  }

  const data = await response.json()
  const promptGerado = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || ''
  
  if (!promptGerado) {
    throw new Error('Prompt vazio retornado pela IA')
  }
  
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
    const DIREITO_PREMIUM_API_KEY = Deno.env.get('DIREITO_PREMIUM_API_KEY')
    const HUGGING_FACE_ACCESS_TOKEN = Deno.env.get('HUGGING_FACE_ACCESS_TOKEN')
    
    if (!HUGGING_FACE_ACCESS_TOKEN) {
      throw new Error('HUGGING_FACE_ACCESS_TOKEN não configurado')
    }

    let promptImagem: string

    if (DIREITO_PREMIUM_API_KEY) {
      try {
        console.log('[gerar-imagem-exemplo] Gerando prompt contextualizado com Gemini...')
        promptImagem = await gerarPromptComIA(
          exemploTexto,
          area || 'Direito',
          tema || 'Questão jurídica',
          DIREITO_PREMIUM_API_KEY
        )
        console.log(`[gerar-imagem-exemplo] Prompt IA gerado: ${promptImagem.substring(0, 150)}...`)
      } catch (iaError) {
        console.warn('[gerar-imagem-exemplo] Fallback para prompt básico:', iaError)
        // Fallback para prompt básico
        const cenario = exemploTexto
          .replace(/[^\w\sáéíóúâêôãõçÁÉÍÓÚÂÊÔÃÕÇ.,!?-]/gi, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .substring(0, 300)
        
        promptImagem = `A professional 3D isometric illustration showing a Brazilian legal scene: ${cenario}. 
Style: Professional 3D render, Blender quality, soft studio lighting, corporate color palette (deep blues, teals, warm oranges).
Characters: Stylized 3D human figures in professional attire.
Background: Clean gradient (light blue to white).`
      }
    } else {
      // Sem API key do Gemini - usar prompt básico
      console.log('[gerar-imagem-exemplo] Usando prompt básico (sem DIREITO_PREMIUM_API_KEY)')
      const cenario = exemploTexto
        .replace(/[^\w\sáéíóúâêôãõçÁÉÍÓÚÂÊÔÃÕÇ.,!?-]/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 300)
      
      promptImagem = `A professional 3D isometric illustration showing a Brazilian legal scene: ${cenario}.
Style: Professional 3D render, soft studio lighting, corporate colors.`
    }

    // Adicionar instruções finais críticas
    promptImagem += `

CRITICAL: NO text, words, letters, numbers, signs, or labels anywhere. Ultra high quality 3D render. Clean professional aesthetic.`

    console.log(`[gerar-imagem-exemplo] Gerando imagem com FLUX.1-dev...`)

    const hf = new HfInference(HUGGING_FACE_ACCESS_TOKEN)
    
    // Usando FLUX.1-dev para qualidade superior
    const image = await hf.textToImage({
      inputs: promptImagem,
      model: 'black-forest-labs/FLUX.1-dev',
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
