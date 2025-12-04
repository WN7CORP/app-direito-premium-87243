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
  
  const promptParaGerarPrompt = `Você é um diretor de arte especializado em criar ilustrações educacionais para o contexto jurídico brasileiro.

CONTEXTO JURÍDICO:
- Área: ${area}
- Tema: ${tema}

CASO PRÁTICO:
${textoLimitado}

SUA MISSÃO:
Criar um prompt VISUAL em inglês para uma ilustração que CONTE A HISTÓRIA do exemplo de forma clara e memorável.

ESTILO VISUAL (OBRIGATÓRIO):
- Estilo: Modern editorial illustration, clean vector art com profundidade 3D sutil
- Composição: VERTICAL (formato retrato 9:16), foco centralizado
- Paleta: Cores vibrantes mas sofisticadas - navy blue (#1e3a5f), teal (#2dd4bf), coral (#f97316), cream (#fef3c7)
- Personagens: Figuras humanas simplificadas mas expressivas, proporções estilizadas, diversidade brasileira
- Cenário: Ambiente contextualizado (tribunal, delegacia, escritório, rua urbana brasileira)
- Iluminação: Luz suave direcional, sombras definidas mas não duras

ELEMENTOS NARRATIVOS (analise o caso):
1. PROTAGONISTA: Quem é o personagem central? (réu, vítima, advogado, juiz, policial, empresário)
2. AÇÃO: O que está acontecendo? (crime, julgamento, negociação, prisão, investigação)
3. OBJETO-CHAVE: Qual elemento representa o caso? (documento, arma, dinheiro, veículo, celular)
4. EMOÇÃO: Qual sentimento transmitir? (tensão, justiça, consequência, resolução)

COMPOSIÇÃO VERTICAL:
- Terço superior: céu/ambiente/contexto
- Terço central: personagens e ação principal
- Terço inferior: elementos de apoio/ground

PROIBIÇÕES ABSOLUTAS:
- ZERO texto, letras, números, placas, legendas
- NADA de sangue, gore ou violência explícita
- NADA de rostos realistas (manter estilizado)
- NADA de símbolos religiosos ou políticos

FORMATO DO OUTPUT:
Escreva APENAS o prompt em inglês, máximo 500 caracteres.
Comece com: "Vertical editorial illustration,"`

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
        
        promptImagem = `Vertical editorial illustration, Brazilian legal scene: ${cenario}. 
Modern clean vector art with subtle 3D depth. Stylized human figures, navy blue and teal palette with coral accents. 
Soft directional lighting, cream background gradient. Professional educational style.`
      }
    } else {
      // Sem API key do Gemini - usar prompt básico
      console.log('[gerar-imagem-exemplo] Usando prompt básico (sem DIREITO_PREMIUM_API_KEY)')
      const cenario = exemploTexto
        .replace(/[^\w\sáéíóúâêôãõçÁÉÍÓÚÂÊÔÃÕÇ.,!?-]/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 300)
      
      promptImagem = `Vertical editorial illustration, Brazilian legal scene: ${cenario}.
Modern clean vector art, stylized figures, navy and teal colors with coral accents. Professional educational style.`
    }

    // Adicionar instruções finais críticas
    promptImagem += `

CRITICAL: Vertical 9:16 aspect ratio composition. NO text, words, letters, numbers, signs anywhere. Ultra high quality render. Clean professional aesthetic.`

    console.log(`[gerar-imagem-exemplo] Gerando imagem com FLUX.1-dev...`)

    const hf = new HfInference(HUGGING_FACE_ACCESS_TOKEN)
    
    // Usando FLUX.1-dev com formato vertical (768x1344 = 9:16)
    const image = await hf.textToImage({
      inputs: promptImagem,
      model: 'black-forest-labs/FLUX.1-dev',
      parameters: {
        width: 768,
        height: 1344,
      }
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
