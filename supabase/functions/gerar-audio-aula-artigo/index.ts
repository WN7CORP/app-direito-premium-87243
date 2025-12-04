import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Funções de normalização para TTS (copiadas do gerar-narracao)
function numeroParaExtenso(n: number): string {
  const unidades = ['zero', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
  const especiais = ['dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
  const dezenas = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
  const centenas = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];

  if (n < 0 || n > 9999) return n.toString();
  if (n === 0) return unidades[0];
  if (n === 100) return 'cem';
  if (n < 10) return unidades[n];
  if (n < 20) return especiais[n - 10];
  if (n < 100) {
    const dezena = Math.floor(n / 10);
    const unidade = n % 10;
    return unidade === 0 ? dezenas[dezena] : `${dezenas[dezena]} e ${unidades[unidade]}`;
  }
  if (n < 1000) {
    const centena = Math.floor(n / 100);
    const resto = n % 100;
    if (resto === 0) return n === 100 ? 'cem' : centenas[centena];
    return `${centenas[centena]} e ${numeroParaExtenso(resto)}`;
  }
  const milhar = Math.floor(n / 1000);
  const resto = n % 1000;
  const milharStr = milhar === 1 ? 'mil' : `${numeroParaExtenso(milhar)} mil`;
  if (resto === 0) return milharStr;
  return `${milharStr} e ${numeroParaExtenso(resto)}`;
}

function numeroParaOrdinal(n: number): string {
  const ordinais: Record<number, string> = {
    1: 'primeiro', 2: 'segundo', 3: 'terceiro', 4: 'quarto', 5: 'quinto',
    6: 'sexto', 7: 'sétimo', 8: 'oitavo', 9: 'nono', 10: 'décimo',
    11: 'décimo primeiro', 12: 'décimo segundo', 13: 'décimo terceiro',
    14: 'décimo quarto', 15: 'décimo quinto', 16: 'décimo sexto',
    17: 'décimo sétimo', 18: 'décimo oitavo', 19: 'décimo nono', 20: 'vigésimo'
  };
  return ordinais[n] || `${n}º`;
}

const abreviacoes: Record<string, string> = {
  'Art\\.': 'Artigo',
  'art\\.': 'artigo',
  'arts\\.': 'artigos',
  'Arts\\.': 'Artigos',
  'Inc\\.': 'Inciso',
  'inc\\.': 'inciso',
  'nº': 'número',
  'n\\.º': 'número',
  'N\\.º': 'Número',
  'Nº': 'Número',
  'nº\\.': 'número',
  '§': 'parágrafo',
  'p\\.': 'página',
  'págs?\\.': 'páginas',
  'Dr\\.': 'Doutor',
  'Dra\\.': 'Doutora',
  'Sr\\.': 'Senhor',
  'Sra\\.': 'Senhora',
  'Prof\\.': 'Professor',
  'Profa\\.': 'Professora',
  'Adv\\.': 'Advogado',
  'Min\\.': 'Ministro',
  'Des\\.': 'Desembargador',
  'Ex\\.': 'Excelentíssimo',
  'Exmo\\.': 'Excelentíssimo',
  'Ilmo\\.': 'Ilustríssimo',
  'V\\.Ex\\.ª': 'Vossa Excelência',
  'V\\. Ex\\.ª': 'Vossa Excelência',
};

const siglasJuridicas: Record<string, string> = {
  'STF': 'Supremo Tribunal Federal',
  'STJ': 'Superior Tribunal de Justiça',
  'TST': 'Tribunal Superior do Trabalho',
  'TSE': 'Tribunal Superior Eleitoral',
  'STM': 'Superior Tribunal Militar',
  'TJ': 'Tribunal de Justiça',
  'TRF': 'Tribunal Regional Federal',
  'TRT': 'Tribunal Regional do Trabalho',
  'TRE': 'Tribunal Regional Eleitoral',
  'OAB': 'Ordem dos Advogados do Brasil',
  'MP': 'Ministério Público',
  'MPF': 'Ministério Público Federal',
  'CF': 'Constituição Federal',
  'CF/88': 'Constituição Federal de mil novecentos e oitenta e oito',
  'CC': 'Código Civil',
  'CP': 'Código Penal',
  'CPC': 'Código de Processo Civil',
  'CPP': 'Código de Processo Penal',
  'CLT': 'Consolidação das Leis do Trabalho',
  'CDC': 'Código de Defesa do Consumidor',
  'CTN': 'Código Tributário Nacional',
  'ECA': 'Estatuto da Criança e do Adolescente',
  'CTB': 'Código de Trânsito Brasileiro',
  'LINDB': 'Lei de Introdução às Normas do Direito Brasileiro',
  'RISTF': 'Regimento Interno do Supremo Tribunal Federal',
  'RISTJ': 'Regimento Interno do Superior Tribunal de Justiça',
};

function normalizarTextoParaTTS(texto: string): string {
  let normalizado = texto;

  // Expandir abreviações
  for (const [abrev, expansao] of Object.entries(abreviacoes)) {
    const regex = new RegExp(abrev, 'g');
    normalizado = normalizado.replace(regex, expansao);
  }

  // Tratar ordinais (1º, 2ª, etc.)
  normalizado = normalizado.replace(/(\d+)[ºª]/g, (_, num) => {
    const n = parseInt(num);
    return numeroParaOrdinal(n);
  });

  // Tratar números romanos comuns em artigos
  const romanosMap: Record<string, string> = {
    'I': 'primeiro', 'II': 'segundo', 'III': 'terceiro', 'IV': 'quarto',
    'V': 'quinto', 'VI': 'sexto', 'VII': 'sétimo', 'VIII': 'oitavo',
    'IX': 'nono', 'X': 'décimo', 'XI': 'décimo primeiro', 'XII': 'décimo segundo',
    'XIII': 'décimo terceiro', 'XIV': 'décimo quarto', 'XV': 'décimo quinto',
    'XVI': 'décimo sexto', 'XVII': 'décimo sétimo', 'XVIII': 'décimo oitavo',
    'XIX': 'décimo nono', 'XX': 'vigésimo'
  };

  // Substituir números romanos quando estão isolados (incisos)
  for (const [romano, extenso] of Object.entries(romanosMap)) {
    const regex = new RegExp(`\\b${romano}\\b(?!\\w)`, 'g');
    normalizado = normalizado.replace(regex, extenso);
  }

  // Expandir siglas jurídicas
  for (const [sigla, expansao] of Object.entries(siglasJuridicas)) {
    const regex = new RegExp(`\\b${sigla}\\b`, 'g');
    normalizado = normalizado.replace(regex, expansao);
  }

  // Tratar números grandes
  normalizado = normalizado.replace(/\b(\d{1,4})\b/g, (match, num) => {
    const n = parseInt(num);
    if (n > 0 && n <= 9999) {
      return numeroParaExtenso(n);
    }
    return match;
  });

  // Limpar caracteres especiais problemáticos para TTS
  normalizado = normalizado.replace(/[*#_~`]/g, '');
  normalizado = normalizado.replace(/\n+/g, '. ');
  normalizado = normalizado.replace(/\s+/g, ' ');
  normalizado = normalizado.trim();

  return normalizado;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { aulaId, slideKey, conteudo } = await req.json();

    if (!aulaId || !slideKey || !conteudo) {
      return new Response(
        JSON.stringify({ error: 'Parâmetros obrigatórios: aulaId, slideKey, conteudo' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verificar se já existe áudio para este slide
    const { data: aulaExistente, error: fetchError } = await supabase
      .from('aulas_artigos')
      .select('audios')
      .eq('id', aulaId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Erro ao buscar aula:', fetchError);
    }

    const audiosExistentes = aulaExistente?.audios || {};
    
    // Se já existe áudio para este slide, retornar
    if (audiosExistentes[slideKey]) {
      console.log(`Áudio já existe para ${slideKey}:`, audiosExistentes[slideKey]);
      return new Response(
        JSON.stringify({ url: audiosExistentes[slideKey], cached: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Normalizar texto para TTS
    const textoNormalizado = normalizarTextoParaTTS(conteudo);
    console.log(`Gerando áudio para slide ${slideKey}. Texto original: ${conteudo.substring(0, 100)}...`);
    console.log(`Texto normalizado: ${textoNormalizado.substring(0, 100)}...`);

    // Chamar Google TTS
    const GOOGLE_TTS_API_KEY = Deno.env.get('GOOGLE_TTS_API_KEY');
    if (!GOOGLE_TTS_API_KEY) {
      throw new Error('GOOGLE_TTS_API_KEY não configurada');
    }

    const ttsResponse = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${GOOGLE_TTS_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: { text: textoNormalizado },
          voice: {
            languageCode: 'pt-BR',
            name: 'pt-BR-Neural2-B',
            ssmlGender: 'MALE'
          },
          audioConfig: {
            audioEncoding: 'MP3',
            speakingRate: 1.0,
            pitch: 0
          }
        })
      }
    );

    if (!ttsResponse.ok) {
      const errorText = await ttsResponse.text();
      console.error('Erro Google TTS:', errorText);
      throw new Error(`Erro ao gerar áudio: ${ttsResponse.status}`);
    }

    const ttsData = await ttsResponse.json();
    const audioContent = ttsData.audioContent;

    // Converter base64 para blob
    const binaryString = atob(audioContent);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const audioBlob = new Blob([bytes], { type: 'audio/mpeg' });

    // Upload para Catbox
    const formData = new FormData();
    formData.append('reqtype', 'fileupload');
    formData.append('fileToUpload', audioBlob, `aula_${aulaId}_${slideKey}.mp3`);

    const catboxResponse = await fetch('https://catbox.moe/user/api.php', {
      method: 'POST',
      body: formData
    });

    if (!catboxResponse.ok) {
      throw new Error('Erro ao fazer upload para Catbox');
    }

    const audioUrl = await catboxResponse.text();
    console.log(`Áudio gerado e salvo: ${audioUrl}`);

    // Salvar URL no banco
    const novosAudios = { ...audiosExistentes, [slideKey]: audioUrl.trim() };
    
    const { error: updateError } = await supabase
      .from('aulas_artigos')
      .update({ audios: novosAudios })
      .eq('id', aulaId);

    if (updateError) {
      console.error('Erro ao salvar URL do áudio:', updateError);
    }

    return new Response(
      JSON.stringify({ url: audioUrl.trim(), cached: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro na função gerar-audio-aula-artigo:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
