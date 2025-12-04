import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
  if (n < 2000000) {
    const resto = n % 1000000;
    return 'um milhão' + (resto ? (resto < 1000 ? ' e ' : ' ') + numeroParaExtenso(resto) : '');
  }
  if (n < 1000000000) {
    const milhao = Math.floor(n / 1000000);
    const resto = n % 1000000;
    return numeroParaExtenso(milhao) + ' milhões' + (resto ? (resto < 1000 ? ' e ' : ' ') + numeroParaExtenso(resto) : '');
  }
  if (n < 2000000000) {
    const resto = n % 1000000000;
    return 'um bilhão' + (resto ? (resto < 1000000 ? ' e ' : ' ') + numeroParaExtenso(resto) : '');
  }
  const bilhao = Math.floor(n / 1000000000);
  const resto = n % 1000000000;
  return numeroParaExtenso(bilhao) + ' bilhões' + (resto ? (resto < 1000000 ? ' e ' : ' ') + numeroParaExtenso(resto) : '');
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
  if (n < 10000) {
    const milhar = Math.floor(n / 1000);
    const resto = n % 1000;
    const milharTexto = milhar === 1 ? 'milésimo' : numeroParaExtenso(milhar) + ' milésimo';
    return milharTexto + (resto ? ' ' + numeroParaOrdinal(resto) : '');
  }
  // Para números muito grandes, usa cardinal
  return numeroParaExtenso(n);
}

// ============================================
// CONVERSÃO DE ROMANOS
// ============================================

function romanoParaNumero(romano: string): number {
  const valores: { [key: string]: number } = {
    'I': 1, 'V': 5, 'X': 10, 'L': 50, 'C': 100, 'D': 500, 'M': 1000
  };
  
  let resultado = 0;
  const upper = romano.toUpperCase();
  
  for (let i = 0; i < upper.length; i++) {
    const atual = valores[upper[i]] || 0;
    const proximo = valores[upper[i + 1]] || 0;
    
    if (atual < proximo) {
      resultado -= atual;
    } else {
      resultado += atual;
    }
  }
  
  return resultado;
}

// ============================================
// VALORES MONETÁRIOS
// ============================================

function valorMonetarioParaExtenso(valor: number): string {
  const inteiro = Math.floor(valor);
  const centavos = Math.round((valor - inteiro) * 100);
  
  let resultado = '';
  
  if (inteiro === 0 && centavos > 0) {
    resultado = numeroParaExtenso(centavos) + (centavos === 1 ? ' centavo' : ' centavos');
  } else if (inteiro > 0) {
    resultado = numeroParaExtenso(inteiro) + (inteiro === 1 ? ' real' : ' reais');
    if (centavos > 0) {
      resultado += ' e ' + numeroParaExtenso(centavos) + (centavos === 1 ? ' centavo' : ' centavos');
    }
  }
  
  return resultado;
}

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
  'TJ': 'Tribunal de Justiça',
  'TRF': 'Tribunal Regional Federal',
  'TRT': 'Tribunal Regional do Trabalho',
  'TST': 'Tribunal Superior do Trabalho',
  'TSE': 'Tribunal Superior Eleitoral',
  'OAB': 'Ordem dos Advogados do Brasil',
  'MP': 'Ministério Público',
  'MPF': 'Ministério Público Federal',
  'AGU': 'Advocacia-Geral da União',
  'LINDB': 'Lei de Introdução às Normas do Direito Brasileiro',
  'LEP': 'Lei de Execução Penal',
  'CTB': 'Código de Trânsito Brasileiro',
  'CPPM': 'Código de Processo Penal Militar',
  'CPM': 'Código Penal Militar',
  'CRFB': 'Constituição da República Federativa do Brasil',
  'ADCT': 'Ato das Disposições Constitucionais Transitórias',
  'EC': 'Emenda Constitucional',
  'LC': 'Lei Complementar',
  'RE': 'Recurso Extraordinário',
  'REsp': 'Recurso Especial',
  'HC': 'Habeas Corpus',
  'MS': 'Mandado de Segurança',
  'ADI': 'Ação Direta de Inconstitucionalidade',
  'ADC': 'Ação Declaratória de Constitucionalidade',
  'ADPF': 'Arguição de Descumprimento de Preceito Fundamental',
};

// ============================================
// FUNÇÃO PRINCIPAL DE NORMALIZAÇÃO
// ============================================

function normalizarTextoParaTTS(texto: string): string {
  let resultado = texto;
  
  // 1. VALORES MONETÁRIOS - R$X.XXX,XX
  resultado = resultado.replace(/R\$\s?([\d.]+),(\d{2})/g, (match, inteiro, centavos) => {
    const valorInteiro = parseInt(inteiro.replace(/\./g, ''), 10);
    const valorCentavos = parseInt(centavos, 10);
    const valorTotal = valorInteiro + valorCentavos / 100;
    return valorMonetarioParaExtenso(valorTotal);
  });
  
  // 2. VALORES MONETÁRIOS SEM CENTAVOS - R$X.XXX ou R$XXX
  resultado = resultado.replace(/R\$\s?([\d.]+)(?![,\d])/g, (match, valor) => {
    const valorNumerico = parseInt(valor.replace(/\./g, ''), 10);
    return valorMonetarioParaExtenso(valorNumerico);
  });
  
  // 3. MULTIPLICADORES - "12 x" ou "12x" → "doze vezes"
  resultado = resultado.replace(/(\d+)\s?[xX]\s?(?=\s|R\$|$)/g, (match, num) => {
    return numeroParaExtenso(parseInt(num, 10)) + ' vezes ';
  });
  
  // 4. PARÁGRAFOS COM NÚMERO - "§1º", "§ 1º", "§1°", "§ 1°"
  resultado = resultado.replace(/§\s?(\d+)[º°]/g, (match, num) => {
    const numero = parseInt(num, 10);
    return 'parágrafo ' + numeroParaOrdinal(numero);
  });
  
  // 5. SÍMBOLO DE PARÁGRAFO SOZINHO
  resultado = resultado.replace(/§(?!\s?\d)/g, 'parágrafo ');
  
  // 6. ARTIGOS COM ORDINAL - "Art. 5º", "art. 5°"
  resultado = resultado.replace(/[Aa]rts?\.\s?(\d+)[º°]/g, (match, num) => {
    const numero = parseInt(num, 10);
    return 'artigo ' + numeroParaOrdinal(numero);
  });
  
  // 7. ARTIGOS SEM ORDINAL - "Art. 121", "art. 121"
  resultado = resultado.replace(/[Aa]rts?\.\s?(\d+)(?![º°\d])/g, (match, num) => {
    const numero = parseInt(num, 10);
    // Artigos até 10 são ordinais, acima são cardinais
    if (numero <= 10) {
      return 'artigo ' + numeroParaOrdinal(numero);
    }
    return 'artigo ' + numeroParaExtenso(numero);
  });
  
  // 7.1. ABREVIAÇÃO "Art." ou "Arts." sozinha (sem número) → "Artigo" ou "Artigos"
  resultado = resultado.replace(/\bArts\.\s?(?!\d)/gi, 'Artigos ');
  resultado = resultado.replace(/\bArt\.\s?(?!\d)/gi, 'Artigo ');
  
  // 8. INCISOS ROMANOS - "I -", "II -", "III.", "IV)", "V,"
  resultado = resultado.replace(/\b([IVXLCDM]+)\s?[-–—.),;:]/g, (match, romano) => {
    // Verificar se é um numeral romano válido
    if (/^[IVXLCDM]+$/.test(romano)) {
      const numero = romanoParaNumero(romano);
      if (numero > 0 && numero < 100) {
        return 'inciso ' + numeroParaOrdinal(numero) + ', ';
      }
    }
    return match;
  });
  
  // 9. ALÍNEAS - "a)", "b)", etc.
  resultado = resultado.replace(/\b([a-z])\)/g, (match, letra) => {
    return 'alínea ' + letra + ', ';
  });
  
  // 10. ORDINAIS ISOLADOS - "1º", "2°", "5º"
  resultado = resultado.replace(/(\d+)[º°](?!\s?[-–])/g, (match, num) => {
    const numero = parseInt(num, 10);
    return numeroParaOrdinal(numero);
  });
  
  // 11. REFERÊNCIAS NUMÉRICAS - "nº 8.078", "n. 18"
  resultado = resultado.replace(/n[º°.]\s?([\d.]+)/gi, (match, num) => {
    const numero = parseInt(num.replace(/\./g, ''), 10);
    return 'número ' + numeroParaExtenso(numero);
  });
  
  // 12. PORCENTAGENS COM DECIMAL - "2,5%"
  resultado = resultado.replace(/(\d+),(\d+)%/g, (match, inteiro, decimal) => {
    return numeroParaExtenso(parseInt(inteiro, 10)) + ' vírgula ' + numeroParaExtenso(parseInt(decimal, 10)) + ' por cento';
  });
  
  // 13. PORCENTAGENS INTEIRAS - "50%"
  resultado = resultado.replace(/(\d+)%/g, (match, num) => {
    return numeroParaExtenso(parseInt(num, 10)) + ' por cento';
  });
  
  // 14. SIGLAS JURÍDICAS COM ANO - "CC/02", "CF/88"
  resultado = resultado.replace(/\b(CC|CPC|CDC|CF|CP|CPP|CTN|CLT|CRFB)\/(\d{2,4})\b/g, (match, sigla, ano) => {
    const siglaExpandida = siglasJuridicas[sigla] || sigla;
    let anoCompleto = ano;
    if (ano.length === 2) {
      anoCompleto = parseInt(ano, 10) < 50 ? '20' + ano : '19' + ano;
    }
    return siglaExpandida + ' de ' + numeroParaExtenso(parseInt(anoCompleto, 10));
  });
  
  // 15. SIGLAS JURÍDICAS SOZINHAS (com boundary)
  for (const [sigla, expandida] of Object.entries(siglasJuridicas)) {
    const regex = new RegExp(`\\b${sigla}\\b(?!\\/)`, 'g');
    resultado = resultado.replace(regex, expandida);
  }
  
  // 16. DATAS - "11/09/1990", "01/01/2024"
  resultado = resultado.replace(/(\d{1,2})\/(\d{1,2})\/(\d{4})/g, (match, dia, mes, ano) => {
    const meses = ['', 'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 
                   'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
    const diaNum = parseInt(dia, 10);
    const mesNum = parseInt(mes, 10);
    const anoNum = parseInt(ano, 10);
    const diaTexto = diaNum === 1 ? 'primeiro' : numeroParaExtenso(diaNum);
    return diaTexto + ' de ' + meses[mesNum] + ' de ' + numeroParaExtenso(anoNum);
  });
  
  // 17. REFERÊNCIA DE ANO ISOLADA - "/2024"
  resultado = resultado.replace(/\/(\d{4})\b/g, (match, ano) => {
    return ' de ' + numeroParaExtenso(parseInt(ano, 10));
  });
  
  // 18. NÚMEROS COM PONTOS DE MILHAR - "8.078" → "oito mil e setenta e oito"
  resultado = resultado.replace(/\b(\d{1,3}(?:\.\d{3})+)\b/g, (match) => {
    const numero = parseInt(match.replace(/\./g, ''), 10);
    return numeroParaExtenso(numero);
  });
  
  // 19. NÚMEROS GRANDES ISOLADOS (4+ dígitos) - contexto de leis, valores
  resultado = resultado.replace(/\b(\d{4,})\b/g, (match) => {
    const numero = parseInt(match, 10);
    // Evitar converter anos já convertidos
    if (numero >= 1900 && numero <= 2100) {
      return numeroParaExtenso(numero);
    }
    return numeroParaExtenso(numero);
  });
  
  // 20. NÚMEROS EM CONTEXTO DE QUANTIDADE - "3 salários", "12 meses"
  resultado = resultado.replace(/(\d+)\s+(salários?|meses?|dias?|anos?|vezes|parcelas?|prestações?|horas?|minutos?)/gi, (match, num, palavra) => {
    return numeroParaExtenso(parseInt(num, 10)) + ' ' + palavra;
  });
  
  // 21. LIMPEZA - Remover espaços duplicados
  resultado = resultado.replace(/\s+/g, ' ').trim();
  
  // 22. LIMPEZA - Vírgulas e pontuação duplicada
  resultado = resultado.replace(/,\s*,/g, ',');
  resultado = resultado.replace(/\.\s*\./g, '.');
  
  console.log(`Texto normalizado: "${texto.substring(0, 100)}..." → "${resultado.substring(0, 100)}..."`);
  
  return resultado;
}

// ============================================
// SERVIDOR PRINCIPAL
// ============================================

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { texto } = await req.json();

    if (!texto) {
      console.error('Missing required field: texto');
      return new Response(
        JSON.stringify({ error: 'texto é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Texto original (${texto.length} caracteres): ${texto.substring(0, 100)}...`);

    // Normalizar texto para TTS
    const textoNormalizado = normalizarTextoParaTTS(texto);
    
    console.log(`Texto normalizado (${textoNormalizado.length} caracteres): ${textoNormalizado.substring(0, 100)}...`);

    // Get GER API key for Google Cloud TTS
    const API_KEY = Deno.env.get('GER');
    if (!API_KEY) {
      console.error('GER API key not configured');
      return new Response(
        JSON.stringify({ error: 'Chave API GER não configurada' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Call Google Cloud TTS API
    console.log('Calling Google TTS API...');
    const ttsResponse = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: { text: textoNormalizado },
          voice: {
            languageCode: 'pt-BR',
            name: 'pt-BR-Chirp3-HD-Sadaltager',
          },
          audioConfig: {
            audioEncoding: 'MP3',
            speakingRate: 1.0,
            pitch: 0.0,
          },
        }),
      }
    );

    if (!ttsResponse.ok) {
      const errorText = await ttsResponse.text();
      console.error('Google TTS error:', ttsResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: 'Erro ao gerar áudio TTS', details: errorText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const ttsData = await ttsResponse.json();
    const audioContent = ttsData.audioContent; // Base64 encoded audio

    if (!audioContent) {
      console.error('No audio content returned from TTS');
      return new Response(
        JSON.stringify({ error: 'TTS não retornou áudio' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Áudio gerado com sucesso: ${audioContent.length} bytes (base64)`);

    return new Response(
      JSON.stringify({ audioBase64: audioContent }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno', details: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
