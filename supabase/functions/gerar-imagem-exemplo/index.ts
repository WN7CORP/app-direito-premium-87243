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
    const { questaoId, exemploTexto } = await req.json()

    if (!questaoId || !exemploTexto) {
      throw new Error('questaoId e exemploTexto são obrigatórios')
    }

    console.log(`[gerar-imagem-exemplo] Processando questão ${questaoId}`)

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

    // 2. Gerar imagem com Lovable AI (Gemini)
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY não configurado')
    }

    // Criar prompt descritivo para ilustrar a cena do exemplo prático
    const textoLimpo = exemploTexto
      .substring(0, 300)
      .replace(/[^\w\sáéíóúâêîôûãõàèìòùç.,!?-]/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim()

    const promptImagem = `Crie um diagrama educacional jurídico simples em preto e branco.

Cena para ilustrar: "${textoLimpo}"

REQUISITOS OBRIGATÓRIOS:
- Fundo branco/claro (como papel de caderno ou quadro branco)
- Apenas linhas pretas, estilo de desenho à mão
- Figuras humanas simplificadas (stick figures)
- Setas mostrando relações entre elementos
- Ícone de balança da justiça no topo
- Layout de diagrama jurídico educativo
- Composição de infográfico educacional
- SEM sombreamento realista, SEM cores, SEM gradientes
- SEM texto, SEM palavras, SEM letras na imagem
- Estilo: ilustração de quadro branco/lousa jurídica`

    console.log(`[gerar-imagem-exemplo] Gerando imagem com Lovable AI...`)

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [{
          role: "user",
          content: promptImagem
        }],
        modalities: ["image", "text"]
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[gerar-imagem-exemplo] Erro da API:', response.status, errorText)
      
      if (response.status === 429) {
        throw new Error('Rate limit excedido. Tente novamente em alguns segundos.')
      }
      if (response.status === 402) {
        throw new Error('Créditos insuficientes para geração de imagem.')
      }
      throw new Error(`Erro na API de imagem: ${response.status}`)
    }

    const data = await response.json()
    const imageBase64 = data.choices?.[0]?.message?.images?.[0]?.image_url?.url

    if (!imageBase64) {
      console.error('[gerar-imagem-exemplo] Resposta sem imagem:', JSON.stringify(data).substring(0, 500))
      throw new Error('API não retornou imagem')
    }

    console.log(`[gerar-imagem-exemplo] Imagem gerada, fazendo upload para Catbox...`)

    // 3. Converter base64 para blob e fazer upload para Catbox
    // Remove o prefixo "data:image/png;base64," se existir
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '')
    const binaryString = atob(base64Data)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    const imageBlob = new Blob([bytes], { type: 'image/png' })

    console.log(`[gerar-imagem-exemplo] Imagem convertida, tamanho: ${imageBlob.size} bytes`)

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
