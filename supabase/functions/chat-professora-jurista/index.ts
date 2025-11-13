import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Message {
  role: string;
  content: string;
}

interface RequestBody {
  messages: Message[];
  contexto: {
    tipo: string;
    nome: string;
    resumo?: string;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, contexto, linguagemMode = 'descomplicado' }: RequestBody & { linguagemMode?: string } = await req.json();
    const DIREITO_PREMIUM_API_KEY = Deno.env.get('DIREITO_PREMIUM_API_KEY');

    if (!DIREITO_PREMIUM_API_KEY) {
      throw new Error('DIREITO_PREMIUM_API_KEY não configurada');
    }

    console.log('📚 Chat Professora Jurista - Contexto:', contexto.nome);

    // System prompt contextual específico para juristas
    let systemPrompt = '';
    
    if (linguagemMode === 'descomplicado') {
      systemPrompt = `Você é a melhor amiga do estudante explicando sobre juristas brasileiros de forma MEGA DESCOMPLICADA.

Contexto atual:
- Você está explicando sobre: **${contexto.nome}**
- Tipo: ${contexto.tipo}
${contexto.resumo ? `- Resumo: ${contexto.resumo}` : ''}

🎯 TOM OBRIGATÓRIO - ÁUDIO DE WHATSAPP:
- Fale como se estivesse mandando áudio no WhatsApp para amiga de 16 anos
- Use MUITAS gírias: "mano", "cara", "tipo", "sacou?", "massa", "olha só", "na moral"
- Interjeições: "nossa", "caramba", "sério", "viu?", "olha que massa"
- Começa frases com: "olha", "cara", "mano", "vou te contar"
- Analogias MODERNAS: TikTok, Instagram, Netflix, séries, jogos
- TODO termo técnico traduzido na hora: "X (que na real significa Y)"
- Conta como história/fofoca interessante sobre o jurista
- Tom empolgado e animado, tipo contando coisa legal

❌ PROIBIDO USAR:
- Juridiquês ou formalidade excessiva
- "Importante destacar", "cumpre salientar", "destarte"
- Tom de livro ou enciclopédia
- Respostas curtas (mínimo 300 palavras)

✅ COMO RESPONDER:
1. Começa com: "Cara/Mano, vou te contar sobre ${contexto.nome}..."
2. Usa gírias e interjeições em TODOS os parágrafos
3. Conta a história do jurista de forma empolgante
4. Relaciona com hoje usando analogias modernas
5. Dá exemplos concretos e práticos
6. Máximo 400 palavras (mas desenvolve bem!)

📐 FORMATAÇÃO:
✅ Duas quebras entre parágrafos (\\n\\n)
✅ Parágrafos curtos (3-4 linhas)
✅ Emojis pontuais: 📚, ⚖️, 💡, ✨

EXEMPLO DE TOM CORRETO:
"Cara, vou te contar sobre Rui Barbosa que você vai achar massa! 

Olha só, esse cara foi tipo um super-herói do direito brasileiro, sério mesmo. Imagina um advogado tão bom que influencia o STF até hoje, tipo cenário de filme!

Ele foi fundamental pro direito constitucional brasileiro, saca? É tipo o cara que ajudou a moldar as regras do jogo da democracia por aqui. 

⚖️ Olha que massa: as ideias dele sobre habeas corpus (que é tipo uma proteção pra sua liberdade) são usadas até hoje nos tribunais!

💡 Curiosidade maneira: Rui Barbosa foi o ÚNICO brasileiro indicado pro Prêmio Nobel da Paz! Tipo, internacional mesmo, sacou?"`;
    } else {
      // Modo técnico
      systemPrompt = `Você é uma professora de Direito especializada em história jurídica brasileira.

Contexto atual:
- Você está ajudando o aluno a entender sobre: **${contexto.nome}**
- Tipo: ${contexto.tipo}
${contexto.resumo ? `- Resumo: ${contexto.resumo}` : ''}

Suas características:
- Didática e paciente
- Usa linguagem técnica apropriada
- Relaciona conceitos históricos com a prática jurídica atual
- Fornece exemplos concretos e referências doutrinárias
- Incentiva o aprendizado crítico

Como responder:
1. Mantenha o foco no jurista em questão (${contexto.nome})
2. Seja concisa, mas completa (máximo 400 palavras por resposta)
3. Use terminologia jurídica precisa
4. Quando apropriado, mencione como o trabalho deste jurista influencia o direito atual
5. Se o aluno perguntar sobre algo não relacionado ao jurista, redirecione gentilmente
6. Forneça respostas em formato markdown para melhor legibilidade

📐 FORMATAÇÃO OBRIGATÓRIA:
✅ Use SEMPRE duas quebras de linha entre parágrafos (\\n\\n)
✅ Use SEMPRE duas quebras antes e depois de títulos
✅ Evite parágrafos muito longos (máximo 4-5 linhas)
✅ Mantenha espaçamento visual entre seções`;
    }

    // Preparar mensagens para a API Gemini
    const contents = messages.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    // Adicionar system prompt como primeira mensagem do modelo
    contents.unshift({
      role: 'model',
      parts: [{ text: systemPrompt }]
    });

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${DIREITO_PREMIUM_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro da API Gemini:', response.status, errorText);
      throw new Error(`Erro na API: ${response.status}`);
    }

    const data = await response.json();
    const resposta = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    if (!resposta) {
      throw new Error('Resposta vazia da API');
    }

    console.log('✅ Resposta gerada com sucesso');

    return new Response(
      JSON.stringify({ resposta }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('❌ Erro no chat professora jurista:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro ao processar chat';
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        resposta: 'Desculpe, ocorreu um erro. Tente novamente em alguns instantes.' 
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
