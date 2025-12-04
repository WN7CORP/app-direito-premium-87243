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

    // Limpar conteúdo e remover termos que podem triggerar filtros de segurança
    const conteudoLimpo = conteudo
      .replace(/[#*_\[\]]/g, '')
      .replace(/\n+/g, ' ')
      // Substituir termos violentos por versões abstratas
      .replace(/atirou|tiro|disparo|bala/gi, 'reagiu')
      .replace(/ferindo|feriu|machucou|lesão/gi, 'afetando')
      .replace(/gravemente|grave/gi, 'significativamente')
      .replace(/arma|pistola|revólver|faca/gi, 'objeto')
      .replace(/mat(ou|ar|ando)/gi, 'prejudicou')
      .replace(/mort(e|o|al)/gi, 'consequência')
      .replace(/sangue|sangrando/gi, 'situação')
      .replace(/assassin(o|ato|ar)/gi, 'ação ilegal')
      .replace(/violên(cia|to)/gi, 'conflito')
      .replace(/agress(ão|or|ivo)/gi, 'confronto')
      .trim()

    // Gerar prompt baseado no tipo - focando em representações abstratas e seguras
    let prompt: string

    if (tipo.startsWith('exemplo')) {
      // Para EXEMPLOS: focar na CENA de forma abstrata e segura
      prompt = `EDUCATIONAL LEGAL ILLUSTRATION - NO TEXT - SAFE FOR ALL AGES

Create a simple, child-friendly sketch illustration showing a legal situation:

Context: "${conteudoLimpo.substring(0, 400)}"

DRAW A PEACEFUL SCENE showing:
- Simple stick figures representing the people involved
- A setting/location (street, building, office)
- Visual symbols showing the legal situation (question marks, thought bubbles)
- Arrows or connections showing relationships

IMPORTANT STYLE RULES:
- Cute, friendly, educational illustration style
- Like a children's educational book
- NO violence, weapons, or threatening imagery
- Show the SITUATION conceptually, not literally
- Use symbols like scales, question marks, thought bubbles
- Wide horizontal composition (16:9)

ABSOLUTE REQUIREMENTS:
⛔ NO text, words, letters, or numbers
⛔ NO violent or threatening imagery
⛔ Keep it abstract and educational
⛔ Child-safe illustration only

Output: A friendly, educational sketch illustration.`
    } else {
      // Para RESUMO: focar nos CONCEITOS de forma abstrata
      prompt = `EDUCATIONAL LEGAL CONCEPT - NO TEXT - SAFE ILLUSTRATION

Create a simple educational sketch about this legal topic:

Topic: ${area || 'Direito'} - ${tema || 'Legal concept'}

Summary context: "${conteudoLimpo.substring(0, 300)}"

DRAW:
- Simple icons representing legal concepts (scales, books, documents)
- Stick figures in peaceful interactions
- Arrows connecting ideas
- Abstract symbols (checkmarks, X marks, question marks)

STYLE:
- Clean, minimalist sketchnote style
- Educational and friendly appearance
- Black ink on cream paper look
- Wide horizontal composition (16:9)

REQUIREMENTS:
⛔ NO text, words, or letters anywhere
⛔ NO violence or threatening imagery
⛔ Abstract, conceptual representation only
⛔ Safe for educational purposes

Output: A clean educational concept illustration.`
    }

    console.log('Gerando imagem com Gemini API direta...')

    // Chamar API direta do Gemini
    const aiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=${DIREITO_PREMIUM_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          responseModalities: ["TEXT", "IMAGE"]
        }
      })
    })

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text()
      console.error('Erro na API Gemini:', aiResponse.status, errorText)
      throw new Error(`Erro na geração de imagem: ${aiResponse.status}`)
    }

    const aiData = await aiResponse.json()
    console.log('Resposta Gemini recebida')

    // Extrair imagem base64 da resposta nativa do Gemini
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
