import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Mapeamento de tipo para coluna no banco
const TIPO_TO_COLUNA: Record<string, string> = {
  'enunciado': 'url_audio',
  'comentario': 'url_audio_comentario',
  'exemplo': 'url_audio_exemplo',
}

// ============================================
// FUNÇÕES DE CONVERSÃO DE NÚMEROS
// ============================================

const unidades = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
const especiais = ['dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
const dezenas = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
const centenas = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];

function numeroParaExtenso(n: number): string {
  if (n === 0) return 'zero';
  if (n < 0) return 'menos ' + numeroParaExtenso(-n);
  
  if (n < 10) return unidades[n];
  if (n < 20) return especiais[n - 10];
  if (n < 100) {
    const dezena = Math.floor(n / 10);
    const unidade = n % 10;
    return dezenas[dezena] + (unidade ? ' e ' + unidades[unidade] : '');
  }
  if (n === 100) return 'cem';
  if (n < 1000) {
    const centena = Math.floor(n / 100);
    const resto = n % 100;
    return centenas[centena] + (resto ? ' e ' + numeroParaExtenso(resto) : '');
  }
  if (n < 2000) {
    const resto = n % 1000;
    return 'mil' + (resto ? (resto < 100 ? ' e ' : ' ') + numeroParaExtenso(resto) : '');
  }
  if (n < 1000000) {
    const milhar = Math.floor(n / 1000);
    const resto = n % 1000;
    return numeroParaExtenso(milhar) + ' mil' + (resto ? (resto < 100 ? ' e ' : ' ') + numeroParaExtenso(resto) : '');
  }
  return n.toString();
}

// ============================================
// FUNÇÕES DE ORDINAIS
// ============================================

const ordinaisUnidades = ['', 'primeiro', 'segundo', 'terceiro', 'quarto', 'quinto', 'sexto', 'sétimo', 'oitavo', 'nono'];
const ordinaisDezenas = ['', 'décimo', 'vigésimo', 'trigésimo', 'quadragésimo', 'quinquagésimo', 'sexagésimo', 'septuagésimo', 'octogésimo', 'nonagésimo'];
const ordinaisCentenas = ['', 'centésimo', 'ducentésimo', 'tricentésimo', 'quadringentésimo', 'quingentésimo', 'sexcentésimo', 'septingentésimo', 'octingentésimo', 'nongentésimo'];

function numeroParaOrdinal(n: number): string {
  if (n <= 0) return numeroParaExtenso(n);
  if (n < 10) return ordinaisUnidades[n];
  if (n < 100) {
    const dezena = Math.floor(n / 10);
    const unidade = n % 10;
    return ordinaisDezenas[dezena] + (unidade ? ' ' + ordinaisUnidades[unidade] : '');
  }
  if (n < 1000) {
    const centena = Math.floor(n / 100);
    const resto = n % 100;
    return ordinaisCentenas[centena] + (resto ? ' ' + numeroParaOrdinal(resto) : '');
  }
  return numeroParaExtenso(n);
}

// ============================================
// ABREVIAÇÕES GERAIS
// ============================================

const abreviacoes: { [key: string]: string } = {
  'arts.': 'artigos',
  'Arts.': 'Artigos',
  'art.': 'artigo',
  'Art.': 'Artigo',
  'inc.': 'inciso',
  'Inc.': 'Inciso',
  'par.': 'parágrafo',
  'Par.': 'Parágrafo',
  'al.': 'alínea',
  'Dr.': 'Doutor',
  'Dra.': 'Doutora',
  'Sr.': 'Senhor',
  'Sra.': 'Senhora',
  'nº': 'número',
  'Nº': 'Número',
  'n.': 'número',
  'etc.': 'etcétera',
  'ex.': 'exemplo',
  'obs.': 'observação',
};

// ============================================
// SIGLAS JURÍDICAS
// ============================================

const siglasJuridicas: { [key: string]: string } = {
  'CC': 'Código Civil',
  'CPC': 'Código de Processo Civil',
  'CDC': 'Código de Defesa do Consumidor',
  'CF': 'Constituição Federal',
  'CP': 'Código Penal',
  'CPP': 'Código de Processo Penal',
  'CTN': 'Código Tributário Nacional',
  'CLT': 'Consolidação das Leis do Trabalho',
  'ECA': 'Estatuto da Criança e do Adolescente',
  'STF': 'Supremo Tribunal Federal',
  'STJ': 'Superior Tribunal de Justiça',
  'OAB': 'Ordem dos Advogados do Brasil',
  'LINDB': 'Lei de Introdução às Normas do Direito Brasileiro',
};

// ============================================
// FUNÇÃO DE NORMALIZAÇÃO
// ============================================

function normalizarTextoParaTTS(texto: string): string {
  let resultado = texto;
  
  // 1. ABREVIAÇÕES - substituir por extenso
  const abreviacoesOrdenadas = Object.entries(abreviacoes).sort((a, b) => b[0].length - a[0].length);
  for (const [abrev, extenso] of abreviacoesOrdenadas) {
    const escapedAbrev = abrev.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escapedAbrev}`, 'gi');
    resultado = resultado.replace(regex, extenso);
  }
  
  // 2. PARÁGRAFOS COM NÚMERO - "§1º", "§ 1º"
  resultado = resultado.replace(/§\s?(\d+)[º°]/g, (match, num) => {
    const numero = parseInt(num, 10);
    return 'parágrafo ' + numeroParaOrdinal(numero);
  });
  
  // 3. ARTIGOS COM ORDINAL - "Artigo 5º", "artigo 5°"
  resultado = resultado.replace(/[Aa]rtigos?\s?(\d+)[º°]/g, (match, num) => {
    const numero = parseInt(num, 10);
    return 'artigo ' + numeroParaOrdinal(numero);
  });
  
  // 4. ARTIGOS SEM ORDINAL - "Artigo 121"
  resultado = resultado.replace(/[Aa]rtigos?\s?(\d+)(?![º°\d])/g, (match, num) => {
    const numero = parseInt(num, 10);
    if (numero <= 10) {
      return 'artigo ' + numeroParaOrdinal(numero);
    }
    return 'artigo ' + numeroParaExtenso(numero);
  });
  
  // 5. ORDINAIS ISOLADOS - "1º", "2°"
  resultado = resultado.replace(/(\d+)[º°](?!\s?[-–])/g, (match, num) => {
    const numero = parseInt(num, 10);
    return numeroParaOrdinal(numero);
  });
  
  // 6. SIGLAS JURÍDICAS
  for (const [sigla, expandida] of Object.entries(siglasJuridicas)) {
    const regex = new RegExp(`\\b${sigla}\\b(?!\\/)`, 'g');
    resultado = resultado.replace(regex, expandida);
  }
  
  // 7. PORCENTAGENS - "50%"
  resultado = resultado.replace(/(\d+)%/g, (match, num) => {
    return numeroParaExtenso(parseInt(num, 10)) + ' por cento';
  });
  
  return resultado;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { questaoId, texto, tipo } = await req.json()

    if (!questaoId || !texto || !tipo) {
      throw new Error('questaoId, texto e tipo são obrigatórios')
    }

    const coluna = TIPO_TO_COLUNA[tipo]
    if (!coluna) {
      throw new Error(`Tipo inválido: ${tipo}. Use: enunciado, comentario, exemplo`)
    }

    console.log(`[gerar-audio-generico] Tipo: ${tipo}, Questão: ${questaoId}`)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 1. Verificar se já existe áudio no banco
    const { data: questao, error: fetchError } = await supabase
      .from('QUESTOES_GERADAS')
      .select(coluna)
      .eq('id', questaoId)
      .single()

    if (fetchError) {
      console.error('[gerar-audio-generico] Erro ao buscar questão:', fetchError)
    }

    // deno-lint-ignore no-explicit-any
    const audioExistente = questao ? (questao as any)[coluna] : null
    if (audioExistente) {
      console.log(`[gerar-audio-generico] Áudio já existe para ${tipo}, retornando cache`)
      return new Response(
        JSON.stringify({ url_audio: audioExistente, cached: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. Gerar áudio com Google TTS
    const GOOGLE_TTS_API_KEY = Deno.env.get('GER')
    if (!GOOGLE_TTS_API_KEY) {
      throw new Error('GER não configurado')
    }

    // Normalizar texto antes de enviar para TTS
    const textoNormalizado = normalizarTextoParaTTS(texto)
    const textoLimitado = textoNormalizado.substring(0, 4900)

    console.log(`[gerar-audio-generico] Gerando áudio para ${tipo}...`)
    console.log(`[gerar-audio-generico] Texto normalizado: ${textoLimitado.substring(0, 200)}...`)

    const ttsResponse = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${GOOGLE_TTS_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: { text: textoLimitado },
          voice: {
            languageCode: 'pt-BR',
            name: 'pt-BR-Chirp3-HD-Fenrir',
            ssmlGender: 'MALE'
          },
          audioConfig: {
            audioEncoding: 'MP3',
            speakingRate: 1.0,
            pitch: 0
          }
        })
      }
    )

    if (!ttsResponse.ok) {
      const errorText = await ttsResponse.text()
      throw new Error(`Google TTS falhou: ${ttsResponse.status} - ${errorText}`)
    }

    const ttsData = await ttsResponse.json()
    const audioContent = ttsData.audioContent

    if (!audioContent) {
      throw new Error('Google TTS não retornou audioContent')
    }

    // 3. Converter base64 para blob e fazer upload para Catbox
    const binaryString = atob(audioContent)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    const audioBlob = new Blob([bytes], { type: 'audio/mpeg' })

    console.log(`[gerar-audio-generico] Áudio gerado, tamanho: ${audioBlob.size} bytes`)

    // 4. Upload para Catbox
    const formData = new FormData()
    formData.append('reqtype', 'fileupload')
    formData.append('fileToUpload', audioBlob, `audio_${tipo}_${questaoId}_${Date.now()}.mp3`)

    const catboxResponse = await fetch('https://catbox.moe/user/api.php', {
      method: 'POST',
      body: formData
    })

    if (!catboxResponse.ok) {
      throw new Error(`Catbox upload falhou: ${catboxResponse.status}`)
    }

    const audioUrl = await catboxResponse.text()
    
    if (!audioUrl.startsWith('https://')) {
      throw new Error(`URL inválida do Catbox: ${audioUrl}`)
    }

    console.log(`[gerar-audio-generico] Upload Catbox sucesso: ${audioUrl}`)

    // 5. Salvar URL no banco
    const updateObj: Record<string, string> = {}
    updateObj[coluna] = audioUrl

    const { error: updateError } = await supabase
      .from('QUESTOES_GERADAS')
      .update(updateObj)
      .eq('id', questaoId)

    if (updateError) {
      console.error('[gerar-audio-generico] Erro ao salvar URL:', updateError)
    } else {
      console.log(`[gerar-audio-generico] URL salva na coluna ${coluna} para questão ${questaoId}`)
    }

    return new Response(
      JSON.stringify({ url_audio: audioUrl, cached: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('[gerar-audio-generico] Erro:', error)
    return new Response(
      JSON.stringify({ error: 'Erro ao gerar áudio', details: error?.message || 'Erro desconhecido' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
