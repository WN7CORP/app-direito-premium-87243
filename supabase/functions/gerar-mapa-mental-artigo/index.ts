import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MapaMentalRequest {
  artigo: string;
  numeroArtigo: string;
  codigoNome: string;
  codigoTabela: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { artigo, numeroArtigo, codigoNome, codigoTabela } = await req.json() as MapaMentalRequest;

    if (!artigo || !numeroArtigo) {
      return new Response(
        JSON.stringify({ error: 'Artigo e número do artigo são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY não configurada');
    }

    const systemPrompt = `Você é um especialista em Direito brasileiro. Sua tarefa é criar mapas mentais verticais e estruturados para artigos de lei.

INSTRUÇÕES:
1. Analise o artigo fornecido e extraia os conceitos principais
2. Crie uma estrutura hierárquica vertical com:
   - Um conceito central (tema principal do artigo)
   - 3-5 ramos principais (categorias como: Elementos, Requisitos, Efeitos, Exceções, Penas, etc.)
   - Sub-ramos para cada categoria (2-4 itens)
   - Conexões com outros artigos relacionados (se aplicável)

FORMATO DE RESPOSTA (JSON):
{
  "conceitoCentral": {
    "titulo": "Título curto do conceito",
    "descricao": "Descrição breve (máx 15 palavras)"
  },
  "ramos": [
    {
      "titulo": "Nome do Ramo",
      "cor": "#cor_hex",
      "subramos": [
        {
          "titulo": "Sub-conceito",
          "descricao": "Explicação breve"
        }
      ]
    }
  ],
  "conexoes": [
    {
      "artigo": "Art. XX",
      "relacao": "Tipo de relação"
    }
  ]
}

CORES SUGERIDAS: #F59E0B (amarelo), #10B981 (verde), #3B82F6 (azul), #8B5CF6 (roxo), #EC4899 (rosa)

Responda APENAS com o JSON, sem markdown ou explicações.`;

    const userPrompt = `Crie um mapa mental vertical para o seguinte artigo do ${codigoNome}:

Art. ${numeroArtigo}
${artigo}

Gere a estrutura completa do mapa mental em JSON.`;

    console.log(`[gerar-mapa-mental-artigo] Gerando mapa para Art. ${numeroArtigo} do ${codigoNome}`);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[gerar-mapa-mental-artigo] Erro na API:', response.status, errorText);
      throw new Error(`Erro na API: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('Resposta vazia da IA');
    }

    // Parse JSON da resposta
    let mapaMental;
    try {
      // Remove possíveis backticks de markdown
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      mapaMental = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('[gerar-mapa-mental-artigo] Erro ao parsear JSON:', parseError);
      console.error('[gerar-mapa-mental-artigo] Conteúdo recebido:', content);
      
      // Fallback structure
      mapaMental = {
        conceitoCentral: {
          titulo: `Art. ${numeroArtigo}`,
          descricao: "Mapa mental do artigo"
        },
        ramos: [
          {
            titulo: "Conteúdo Principal",
            cor: "#F59E0B",
            subramos: [
              {
                titulo: "Dispositivo Legal",
                descricao: artigo.substring(0, 100) + "..."
              }
            ]
          }
        ],
        conexoes: []
      };
    }

    console.log(`[gerar-mapa-mental-artigo] Mapa mental gerado com sucesso para Art. ${numeroArtigo}`);

    return new Response(
      JSON.stringify({ mapaMental, cached: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[gerar-mapa-mental-artigo] Erro:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
