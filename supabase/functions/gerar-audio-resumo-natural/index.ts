import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Função para normalizar texto para TTS - expande abreviações jurídicas
function normalizarTextoParaTTS(texto: string): string {
  let textoNormalizado = texto;
  
  // Expandir abreviações jurídicas comuns
  const abreviacoes: [RegExp, string][] = [
    // Artigo - várias formas
    [/\bArt\.\s*/gi, 'Artigo '],
    [/\bart\.\s*/g, 'artigo '],
    [/\barts\.\s*/gi, 'artigos '],
    
    // Parágrafo
    [/§\s*(\d+)/g, 'parágrafo $1'],
    [/§§\s*/g, 'parágrafos '],
    [/§\s*único/gi, 'parágrafo único'],
    
    // Inciso
    [/\bInc\.\s*/gi, 'Inciso '],
    [/\binc\.\s*/g, 'inciso '],
    [/\bincs\.\s*/gi, 'incisos '],
    
    // Alínea
    [/\bAl\.\s*/gi, 'Alínea '],
    [/\bal\.\s*/g, 'alínea '],
    
    // Número
    [/\bNº\s*/gi, 'número '],
    [/\bn[º°]\s*/gi, 'número '],
    [/\bNr\.\s*/gi, 'número '],
    
    // Constituição Federal
    [/\bCF\/88\b/gi, 'Constituição Federal de 1988'],
    [/\bCF\b/g, 'Constituição Federal'],
    
    // Códigos
    [/\bCC\/2002\b/gi, 'Código Civil de 2002'],
    [/\bCC\b/g, 'Código Civil'],
    [/\bCP\b/g, 'Código Penal'],
    [/\bCPC\b/g, 'Código de Processo Civil'],
    [/\bCPP\b/g, 'Código de Processo Penal'],
    [/\bCLT\b/g, 'Consolidação das Leis do Trabalho'],
    [/\bCTN\b/g, 'Código Tributário Nacional'],
    [/\bCDC\b/g, 'Código de Defesa do Consumidor'],
    [/\bCTB\b/g, 'Código de Trânsito Brasileiro'],
    [/\bECA\b/g, 'Estatuto da Criança e do Adolescente'],
    
    // Tribunais
    [/\bSTF\b/g, 'Supremo Tribunal Federal'],
    [/\bSTJ\b/g, 'Superior Tribunal de Justiça'],
    [/\bTST\b/g, 'Tribunal Superior do Trabalho'],
    [/\bTSE\b/g, 'Tribunal Superior Eleitoral'],
    [/\bTJ\b/g, 'Tribunal de Justiça'],
    [/\bTRF\b/g, 'Tribunal Regional Federal'],
    [/\bTRT\b/g, 'Tribunal Regional do Trabalho'],
    [/\bTRE\b/g, 'Tribunal Regional Eleitoral'],
    
    // Outros termos jurídicos
    [/\bMP\b/g, 'Ministério Público'],
    [/\bOAB\b/g, 'Ordem dos Advogados do Brasil'],
    [/\bDOU\b/g, 'Diário Oficial da União'],
    [/\bLC\b/g, 'Lei Complementar'],
    [/\bEC\b/g, 'Emenda Constitucional'],
    [/\bADI\b/g, 'Ação Direta de Inconstitucionalidade'],
    [/\bADC\b/g, 'Ação Declaratória de Constitucionalidade'],
    [/\bADPF\b/g, 'Arguição de Descumprimento de Preceito Fundamental'],
    [/\bRE\b/g, 'Recurso Extraordinário'],
    [/\bREsp\b/gi, 'Recurso Especial'],
    [/\bHC\b/g, 'Habeas Corpus'],
    [/\bMS\b/g, 'Mandado de Segurança'],
    
    // Expressões latinas comuns
    [/\bin fine\b/gi, 'in fine'],
    [/\bcaput\b/gi, 'caput'],
    
    // Outras abreviações
    [/\bDr\.\s*/g, 'Doutor '],
    [/\bDra\.\s*/g, 'Doutora '],
    [/\bProf\.\s*/g, 'Professor '],
    [/\bProfa\.\s*/g, 'Professora '],
    [/\betc\.\s*/g, 'etcétera '],
    [/\bp\.\s*ex\.\s*/gi, 'por exemplo '],
    [/\bi\.e\.\s*/gi, 'isto é '],
  ];
  
  for (const [regex, substituicao] of abreviacoes) {
    textoNormalizado = textoNormalizado.replace(regex, substituicao);
  }
  
  return textoNormalizado;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { resumoId, texto, tipo } = await req.json();
    
    if (!resumoId || !texto || !tipo) {
      throw new Error('resumoId, texto e tipo são obrigatórios');
    }

    const tiposValidos = ['resumo', 'exemplos', 'termos'];
    if (!tiposValidos.includes(tipo)) {
      throw new Error('tipo deve ser: resumo, exemplos ou termos');
    }

    console.log(`Gerando áudio ${tipo} para resumo ${resumoId}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verificar se já existe áudio no cache
    const coluna = `url_audio_${tipo}` as 'url_audio_resumo' | 'url_audio_exemplos' | 'url_audio_termos';
    const { data: resumo, error: fetchError } = await supabase
      .from('RESUMO')
      .select('url_audio_resumo, url_audio_exemplos, url_audio_termos')
      .eq('id', resumoId)
      .single();

    if (fetchError) {
      console.error('Erro ao buscar resumo:', fetchError);
    }

    // Se já tem áudio, retornar do cache
    const existingUrl = resumo?.[coluna];
    if (existingUrl) {
      console.log(`Áudio ${tipo} encontrado no cache`);
      return new Response(
        JSON.stringify({ url_audio: existingUrl, cached: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Limpar texto para narração (remover markdown)
    // Limite de 4000 chars para ficar dentro dos 5000 bytes (caracteres PT-BR podem usar 2+ bytes)
    const textoLimpo = texto
      .replace(/#{1,6}\s?/g, '') // Remove headers markdown
      .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold
      .replace(/\*([^*]+)\*/g, '$1') // Remove italic
      .replace(/`([^`]+)`/g, '$1') // Remove code
      .replace(/>\s?/g, '') // Remove blockquotes
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links, keep text
      .replace(/[-*+]\s/g, '. ') // Convert list markers to pauses
      .replace(/\n{2,}/g, '. ') // Multiple newlines to pause
      .replace(/\n/g, ' ') // Single newline to space
      .replace(/\s{2,}/g, ' ') // Multiple spaces to single
      .trim()
      .substring(0, 4000); // Limite seguro para 5000 bytes

    if (!textoLimpo) {
      throw new Error('Texto vazio após limpeza');
    }

    // Normalizar texto para TTS - expande abreviações como "art." para "artigo"
    const textoNormalizado = normalizarTextoParaTTS(textoLimpo);
    console.log(`Texto normalizado: ${textoNormalizado.length} caracteres`);

    // Gerar áudio com Google Cloud TTS
    const GOOGLE_API_KEY = Deno.env.get('GOOGLE_API_KEY');
    if (!GOOGLE_API_KEY) {
      throw new Error('GOOGLE_API_KEY não configurado');
    }

    console.log('Gerando áudio com Google Cloud TTS...');

    const ttsResponse = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${GOOGLE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: { text: textoNormalizado },
          voice: {
            languageCode: 'pt-BR',
            name: 'pt-BR-Wavenet-B',
            ssmlGender: 'MALE'
          },
          audioConfig: {
            audioEncoding: 'MP3',
            speakingRate: 0.95,
            pitch: -1.0
          }
        })
      }
    );

    if (!ttsResponse.ok) {
      const errorText = await ttsResponse.text();
      console.error('Erro Google TTS:', ttsResponse.status, errorText);
      throw new Error(`Erro ao gerar áudio: ${ttsResponse.status} - ${errorText}`);
    }

    const ttsData = await ttsResponse.json();
    const audioContent = ttsData.audioContent;

    if (!audioContent) {
      throw new Error('Google TTS não retornou conteúdo de áudio');
    }

    // Converter base64 para blob
    const binaryString = atob(audioContent);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const audioBlob = new Blob([bytes], { type: 'audio/mpeg' });

    console.log('Áudio gerado, tamanho:', audioBlob.size);

    // Upload para Catbox
    const formData = new FormData();
    formData.append('reqtype', 'fileupload');
    formData.append('fileToUpload', audioBlob, `resumo_${tipo}_${resumoId}.mp3`);

    console.log('Fazendo upload para Catbox...');
    
    const catboxResponse = await fetch('https://catbox.moe/user/api.php', {
      method: 'POST',
      body: formData,
    });

    if (!catboxResponse.ok) {
      throw new Error(`Erro no upload para Catbox: ${catboxResponse.status}`);
    }

    const audioUrl = await catboxResponse.text();
    
    if (!audioUrl.startsWith('http')) {
      throw new Error(`URL inválida do Catbox: ${audioUrl}`);
    }

    console.log('Upload concluído:', audioUrl);

    // Salvar URL no banco
    const updateData: Record<string, string> = {};
    updateData[coluna] = audioUrl;

    const { error: updateError } = await supabase
      .from('RESUMO')
      .update(updateData)
      .eq('id', resumoId);

    if (updateError) {
      console.error('Erro ao salvar URL no banco:', updateError);
    } else {
      console.log('URL salva no banco com sucesso');
    }

    return new Response(
      JSON.stringify({ url_audio: audioUrl, cached: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
