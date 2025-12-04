import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Função para gerar o prompt de descrição do infográfico
function gerarPromptDescricao(codigoTabela: string, numeroArtigo: string, conteudoArtigo: string): string {
  return `Você é um especialista em criar descrições detalhadas para infográficos jurídicos educacionais.

Analise o seguinte artigo de lei e crie uma descrição estruturada para um MAPA MENTAL VERTICAL em formato de infográfico.

CÓDIGO/LEI: ${codigoTabela}
ARTIGO: ${numeroArtigo}
CONTEÚDO: ${conteudoArtigo}

Crie uma descrição detalhada do infográfico seguindo esta estrutura:

1. TÍTULO PRINCIPAL (topo): "${codigoTabela} - ${numeroArtigo}"
2. CONCEITO CENTRAL: O tema principal do artigo em uma frase curta
3. ELEMENTOS CHAVE (3-5 caixas): Os pontos principais do artigo, cada um com:
   - Título curto (2-4 palavras)
   - Descrição breve (máximo 10 palavras)
4. CONEXÕES: Como os elementos se relacionam (setas, linhas)
5. EXEMPLOS OU APLICAÇÕES (se houver): Casos práticos mencionados
6. CONSEQUÊNCIAS/PENALIDADES (se aplicável): Sanções ou resultados

IMPORTANTE:
- Layout VERTICAL (de cima para baixo)
- Texto CONCISO e DIRETO
- Linguagem ACESSÍVEL
- Máximo 100 palavras no total do conteúdo das caixas

Responda APENAS com a descrição estruturada, sem explicações adicionais.`;
}

// Função para gerar o prompt da imagem
function gerarPromptImagem(descricaoInfografico: string, codigoTabela: string, numeroArtigo: string): string {
  return `Create a professional VERTICAL legal infographic mind map image.

STYLE REQUIREMENTS:
- Dark navy blue background (#1a1a2e or similar dark professional color)
- Primary accent color: Golden yellow (#f5c518) for highlights and connections
- Secondary color: White (#ffffff) for main text
- Clean, modern, minimalist design
- Professional legal/law theme
- Rounded corner boxes for content
- Smooth curved arrows connecting elements
- NO watermarks, NO signatures, NO external text

LAYOUT (TOP TO BOTTOM):
1. HEADER at very top: "${codigoTabela} - ${numeroArtigo}" in large bold white text with yellow underline
2. MAIN CONCEPT: Large central rounded box with the core concept
3. KEY ELEMENTS: 3-5 smaller boxes arranged vertically, connected by yellow curved arrows
4. FOOTER: Small icons representing law (scales of justice, gavel, document)

VISUAL ELEMENTS:
- Use simple geometric icons (scales, gavel, document, shield, checkmark)
- Curved yellow connecting lines/arrows between boxes
- Subtle glow effects on important elements
- Gradient backgrounds on boxes (dark to slightly lighter)
- Professional sans-serif typography
- High contrast for readability

CONTENT TO VISUALIZE:
${descricaoInfografico}

TECHNICAL:
- Vertical portrait orientation (taller than wide)
- Resolution suitable for mobile viewing
- Clean edges, no bleeding
- Consistent spacing between elements

Generate a clean, professional, educational infographic that a law student would use to study. Make it visually appealing and easy to understand at a glance.`;
}

// Upload para Catbox
async function uploadToCatbox(imageBase64: string): Promise<string> {
  console.log("Iniciando upload para Catbox...");
  
  // Remover prefixo data:image se existir
  const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
  const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
  
  const formData = new FormData();
  formData.append('reqtype', 'fileupload');
  formData.append('fileToUpload', new Blob([binaryData], { type: 'image/png' }), 'mapa-mental.png');
  
  const response = await fetch('https://catbox.moe/user/api.php', {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    throw new Error(`Catbox upload failed: ${response.status}`);
  }
  
  const url = await response.text();
  console.log("Upload Catbox concluído:", url);
  return url.trim();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { codigoTabela, numeroArtigo, conteudoArtigo } = await req.json();
    
    console.log(`Gerando mapa mental para: ${codigoTabela} - ${numeroArtigo}`);

    if (!codigoTabela || !numeroArtigo || !conteudoArtigo) {
      return new Response(JSON.stringify({ error: 'Parâmetros obrigatórios faltando' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')!;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Verificar cache
    const { data: cached } = await supabase
      .from('mapas_mentais_artigos')
      .select('imagem_url')
      .eq('codigo_tabela', codigoTabela)
      .eq('numero_artigo', numeroArtigo)
      .single();

    if (cached?.imagem_url) {
      console.log("Mapa mental encontrado no cache");
      return new Response(JSON.stringify({ 
        imagemUrl: cached.imagem_url,
        cached: true 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // PASSO 1: Gerar descrição estruturada com Gemini Text
    console.log("Passo 1: Gerando descrição do infográfico...");
    
    const promptDescricao = gerarPromptDescricao(codigoTabela, numeroArtigo, conteudoArtigo);
    
    const descricaoResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "user", content: promptDescricao }
        ],
      }),
    });

    if (!descricaoResponse.ok) {
      const errorText = await descricaoResponse.text();
      console.error("Erro na geração da descrição:", errorText);
      throw new Error(`Erro ao gerar descrição: ${descricaoResponse.status}`);
    }

    const descricaoData = await descricaoResponse.json();
    const descricaoInfografico = descricaoData.choices?.[0]?.message?.content || "";
    
    console.log("Descrição gerada:", descricaoInfografico.substring(0, 200) + "...");

    // PASSO 2: Gerar imagem com Nano Banana (Gemini Image)
    console.log("Passo 2: Gerando imagem do infográfico...");
    
    const promptImagem = gerarPromptImagem(descricaoInfografico, codigoTabela, numeroArtigo);
    
    const imagemResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [
          { role: "user", content: promptImagem }
        ],
        modalities: ["image", "text"],
      }),
    });

    if (!imagemResponse.ok) {
      const errorText = await imagemResponse.text();
      console.error("Erro na geração da imagem:", errorText);
      throw new Error(`Erro ao gerar imagem: ${imagemResponse.status}`);
    }

    const imagemData = await imagemResponse.json();
    console.log("Resposta da geração de imagem recebida");
    
    // Extrair imagem base64
    const imageBase64 = imagemData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (!imageBase64) {
      console.error("Imagem não encontrada na resposta:", JSON.stringify(imagemData).substring(0, 500));
      throw new Error("Imagem não gerada");
    }

    // PASSO 3: Upload para Catbox
    console.log("Passo 3: Fazendo upload para Catbox...");
    const catboxUrl = await uploadToCatbox(imageBase64);

    // PASSO 4: Salvar no cache
    console.log("Passo 4: Salvando no cache...");
    const { error: insertError } = await supabase
      .from('mapas_mentais_artigos')
      .upsert({
        codigo_tabela: codigoTabela,
        numero_artigo: numeroArtigo,
        conteudo_artigo: conteudoArtigo,
        imagem_url: catboxUrl,
        prompt_usado: promptImagem,
      }, {
        onConflict: 'codigo_tabela,numero_artigo'
      });

    if (insertError) {
      console.error("Erro ao salvar cache:", insertError);
    }

    console.log("Mapa mental gerado com sucesso!");
    
    return new Response(JSON.stringify({ 
      imagemUrl: catboxUrl,
      cached: false 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Erro ao gerar mapa mental:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});