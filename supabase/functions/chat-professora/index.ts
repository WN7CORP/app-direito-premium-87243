import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0';
import { BLOCOS_BASE, EXTENSAO_CONFIG } from './prompt-templates.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, accept',
};

serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const { messages, files, mode, extractedText, deepMode = false, responseLevel = 'complete', linguagemMode = 'descomplicado' }: any = await request.json();
    
    console.log('📥 Requisição recebida:', {
      mode,
      messagesCount: messages?.length,
      filesCount: files?.length || 0,
      hasVademecumKey: !!Deno.env.get('VADEMECUM_API_KEY'),
      hasLovableKey: !!Deno.env.get('LOVABLE_API_KEY'),
      hasServiceRole: !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    });
    
    // Detectar se é ação pós-análise (usuário clicou em "Resumir", "Explicar", etc.)
    const lastUserMessage = messages[messages.length - 1]?.content || '';
    const isPostAnalysisAction = lastUserMessage.includes('Com base no material que você analisou');
    
    // Se é ação pós-análise, não usar modo de análise inicial
    const isAnalyzeMode = mode === 'analyze' && !isPostAnalysisAction;
    
    const DIREITO_PREMIUM_API_KEY = Deno.env.get('DIREITO_PREMIUM_API_KEY') || 
                                     Deno.env.get('DIREITO_PREMIUM_API_KEY_RESERVA');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!DIREITO_PREMIUM_API_KEY) {
      console.error('❌ DIREITO_PREMIUM_API_KEY não configurada');
      return new Response(
        JSON.stringify({ error: 'Chave API não configurada. Configure DIREITO_PREMIUM_API_KEY nos secrets do Supabase.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    
    // Detectar se há imagem ou PDF anexado
    const hasImageOrPdf = files && files.length > 0;

    const supabaseClient = createClient(
      SUPABASE_URL!,
      SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          persistSession: false
        }
      }
    );

    // Função para detectar artigos
    async function detectArtigos(text: string) {
      const regex = /(Art\.\s?\d+(\-\d+)?[A-Z]?(\,?\s?§\s?\d+)?(\,?\s?Inciso\s?[IVXLCDM]+)?(\,?\s?Parágrafo\s?\d+)?(\,?\s?nº\s?\d+)?)\s([\s\S]*?)(\.|;|\\n)/gmi;
      let matches = [...text.matchAll(regex)];
      let artigos = matches.map(match => {
        return {
          texto: match[0].trim()
        };
      });

      // Remover duplicatas
      artigos = artigos.filter((artigo, index, self) =>
        index === self.findIndex((t) => (
          t.texto === artigo.texto
        ))
      );

      return artigos;
    }

    // Função para buscar contexto do banco de dados
    async function buscarContextoBancoDados(pergunta: string) {
      let contextoExtra = "";
      
      try {
        // 1. Detectar números de artigos mencionados na pergunta
        const artigoRegex = /art(?:igo)?\.?\s*(\d+)/gi;
        const matches = [...pergunta.matchAll(artigoRegex)];
        const numerosArtigos = matches.map(m => m[1]);

        // 2. Detectar código mencionado (CP, CC, CF, etc.)
        const codigoRegex = /(CP|CC|CF|CPC|CPP|CLT|CDC|CTN|CTB|CE|CA|CBA|CBT|CCOM|CDM|ECA|OAB|Código Penal|Código Civil|Constituição)/gi;
        const codigoMatch = pergunta.match(codigoRegex);
        
        let tabelaBusca = null;
        if (codigoMatch) {
          const codigo = codigoMatch[0].toUpperCase();
          const mapaCodigos: any = {
            'CP': 'CP - Código Penal',
            'CÓDIGO PENAL': 'CP - Código Penal',
            'CC': 'CC - Código Civil',
            'CÓDIGO CIVIL': 'CC - Código Civil',
            'CF': 'CF - Constituição Federal',
            'CONSTITUIÇÃO': 'CF - Constituição Federal',
            'CPC': 'CPC – Código de Processo Civil',
            'CPP': 'CPP – Código de Processo Penal',
            'CLT': 'CLT – Consolidação das Leis do Trabalho',
            'CDC': 'CDC – Código de Defesa do Consumidor',
            'CTN': 'CTN – Código Tributário Nacional',
            'CTB': 'CTB Código de Trânsito Brasileiro',
            'CE': 'CE – Código Eleitoral',
            'ECA': 'ESTATUTO - ECA',
            'OAB': 'ESTATUTO - OAB'
          };
          tabelaBusca = mapaCodigos[codigo] || null;
        }

        // 3. Buscar artigos específicos se foram mencionados
        if (numerosArtigos.length > 0 && tabelaBusca) {
          const { data: artigos, error } = await supabaseClient
            .from(tabelaBusca as any)
            .select('*')
            .in('Número do Artigo', numerosArtigos)
            .limit(5);

          if (!error && artigos && artigos.length > 0) {
            contextoExtra += "\n\n📚 ARTIGOS DO VADE MECUM RELACIONADOS:\n\n";
            artigos.forEach((art: any) => {
              contextoExtra += `**Art. ${art['Número do Artigo']} - ${tabelaBusca?.split(' - ')[1] || tabelaBusca}**\n`;
              contextoExtra += `${art.Artigo}\n`;
              if (art.explicacao_resumido) {
                contextoExtra += `💡 Explicação: ${art.explicacao_resumido}\n`;
              }
              contextoExtra += "\n";
            });
          }
        }

        // 4. Buscar termos jurídicos relacionados no dicionário
        const palavrasChave = pergunta.toLowerCase().split(' ')
          .filter(p => p.length > 4)
          .slice(0, 5);
        
        if (palavrasChave.length > 0) {
          const { data: termos, error } = await supabaseClient
            .from('DICIONARIO')
            .select('*')
            .or(palavrasChave.map(p => `Palavra.ilike.%${p}%`).join(','))
            .limit(3);

          if (!error && termos && termos.length > 0) {
            contextoExtra += "\n\n📖 DEFINIÇÕES JURÍDICAS RELEVANTES:\n\n";
            termos.forEach((termo: any) => {
              contextoExtra += `**${termo.Palavra}:** ${termo.Significado}\n`;
              if (termo.exemplo_pratico) {
                contextoExtra += `Exemplo: ${termo.exemplo_pratico}\n`;
              }
              contextoExtra += "\n";
            });
          }
        }

        // 5. Buscar conteúdo de cursos relacionados
        const { data: cursosRelacionados, error: cursosError } = await supabaseClient
          .from('CURSOS-APP')
          .select('area, tema, conteudo')
          .or(palavrasChave.map(p => `tema.ilike.%${p}%`).join(','))
          .limit(2);

        if (!cursosError && cursosRelacionados && cursosRelacionados.length > 0) {
          contextoExtra += "\n\n🎓 CONTEÚDO DE CURSOS RELACIONADO:\n\n";
          cursosRelacionados.forEach((curso: any) => {
            contextoExtra += `**${curso.tema}** (${curso.area})\n`;
            const preview = curso.conteudo?.substring(0, 500) || '';
            if (preview) {
              contextoExtra += `${preview}...\n\n`;
            }
          });
        }

      } catch (error) {
        console.error('Erro ao buscar contexto do banco:', error);
      }

      return contextoExtra;
    }

    const fileAnalysisPrefix = files && files.length > 0
      ? "\n\nTEXTO EXTRAÍDO DOS ARQUIVOS:\n" + extractedText
      : "";

    // Construir contexto customizado
    let cfContext = "";
    if (deepMode) {
      cfContext = `\n\nCONTEXTO:\n- O usuário pediu análise aprofundada\n`;
    }
    
    // Buscar contexto adicional do banco de dados
    const contextoBanco = await buscarContextoBancoDados(lastUserMessage);
    if (contextoBanco) {
      cfContext += contextoBanco;
    }
    
    // Instruções FORTES para análise automática de imagem/PDF
    // Preparar o prompt do sistema baseado no modo e nível de resposta
    let systemPrompt = '';
    
    if (isAnalyzeMode) {
      systemPrompt = `Você é uma Professora de Direito analisando material de forma objetiva.

🚨 MODO: ANÁLISE INICIAL SÉRIA E PROFISSIONAL

REGRAS CRÍTICAS:
❌ NÃO use tom descomplicado/informal/didático
❌ NÃO explique conceitos sem antes transcrever
❌ NÃO use linguagem coloquial ("tipo assim", "olha", "sacou")
✅ Seja séria, objetiva e descritiva
✅ Transcreva primeiro, analise depois
✅ Use linguagem técnica apropriada

ESTRUTURA OBRIGATÓRIA:
1. TRANSCRIÇÃO/DESCRIÇÃO literal do conteúdo
2. **Tema principal:** [identificar em 1 frase]
3. "Como posso te ajudar com este material?"
4. [ACAO_BUTTONS]

${cfContext}`;
      
    } else if (mode === 'lesson') {
      systemPrompt = `Você é a Professora Jurídica, uma educadora especializada em ensinar direito de forma didática e profunda.

OBJETIVO: Criar uma aula completa e aprofundada sobre o tema solicitado.

NUNCA USE DIAGRAMAS - Use apenas texto formatado e componentes visuais.

${BLOCOS_BASE.regrasFormatacao}

COMPONENTES VISUAIS OBRIGATÓRIOS:

[IMPORTANTE], [ATENÇÃO], [DICA], [NOTA]

[COMPARAÇÃO: Título Descritivo]
{\\"cards\\":[{\\"title\\":\\"Conceito A\\",\\"description\\":\\"Explicação completa\\",\\"example\\":\\"Exemplo\\",\\"icon\\":\\"📜\\"}]}
[/COMPARAÇÃO]

[CASOS_PRATICOS]
{\\"cases\\":[{\\"title\\":\\"Caso 1\\",\\"scenario\\":\\"Descrição\\",\\"analysis\\":\\"Análise\\",\\"solution\\":\\"Solução\\",\\"legalBasis\\":[\\"Art. X\\"],\\"icon\\":\\"⚖️\\"}]}
[/CASOS_PRATICOS]

[QUESTOES_CLICAVEIS]
[\\"Pergunta 1?\\",\\"Pergunta 2?\\",\\"Pergunta 3?\\\"]
[/QUESTOES_CLICAVEIS]

⚠️ EXTENSÃO OBRIGATÓRIA - NÍVEL: ${responseLevel}
- basic: Mínimo ${EXTENSAO_CONFIG.lesson.basic.palavras[0]} palavras
- deep: Mínimo ${EXTENSAO_CONFIG.lesson.deep.palavras[0]} palavras  
- complete: Mínimo ${EXTENSAO_CONFIG.lesson.complete.palavras[0]} palavras

${cfContext || ''}`;
    } else if (mode === 'recommendation') {
      systemPrompt = `Você é a Professora Jurídica, assistente de estudos especializada em direito brasileiro.

MODO: Recomendação de Conteúdo
OBJETIVO: Recomendar materiais de estudo relevantes e personalizados.

Inclua links e organize por tipo (artigos, jurisprudência, livros, videoaulas, etc.).`;
    } else {
      // Modo padrão - chat de estudos
      const level = responseLevel || 'complete';
      
      if (linguagemMode === 'descomplicado') {
        // ========== MODO DESCOMPLICADO ==========
        
        if (level === 'basic') {
          systemPrompt = `🚨 VOCÊ ESTÁ MANDANDO UM ÁUDIO DE WHATSAPP - MODO MEGA DESCOMPLICADO

${BLOCOS_BASE.vozDescomplicada}

${BLOCOS_BASE.componentesDescomplicado}

${BLOCOS_BASE.regrasFormatacao}

⚠️ EXTENSÃO MÍNIMA OBRIGATÓRIA:
- MÍNIMO ${EXTENSAO_CONFIG.descomplicado.basic.palavras[0]} palavras
- IDEAL ${EXTENSAO_CONFIG.descomplicado.basic.palavras[1]} palavras
- ${EXTENSAO_CONFIG.descomplicado.basic.caracteres[0]}-${EXTENSAO_CONFIG.descomplicado.basic.caracteres[1]} caracteres

🎯 COMO VOCÊ DEVE RESPONDER:

Você está mandando um ÁUDIO DE WHATSAPP para uma amiga de 16 anos explicando direito!

OBRIGATÓRIO:
1. Comece SEMPRE com: "Cara," / "Mano," / "Olha só," / "Vou te contar"
2. Use MUITAS gírias: "tipo", "sacou?", "massa", "na moral", "peraí", "olha isso"
3. Interjeições naturais: "nossa", "caramba", "sério", "olha que massa"
4. Analogias MODERNAS: TikTok, Instagram, Netflix, Uber, jogos, delivery
5. TODO termo jurídico traduzido NA HORA: "ADI (que é tipo um alerta)"
6. Tom de história/fofoca interessante, não de aula
7. MUITOS exemplos com nomes comuns (João, Maria, Ana)

📝 ESTRUTURA (TOM ÁUDIO WHATSAPP):

## 📚 [Título Chamativo]

Cara/Mano, bora lá que vou te explicar [tema] de um jeito que você vai sacar na hora! 

[3-4 parágrafos SUPER conversacionais]
- "Olha só", "Vou te falar", "Sabe quando"
- Gírias em TODO parágrafo
- Analogia moderna logo no início
- Tom de amiga animada

[DICA DE OURO 💎]
Macete massa com linguagem informal: "Pensa assim:", "Mnemônico maneiro:"
[/DICA DE OURO]

## 💡 Como Funciona na Prática (Vem Comigo!)

Agora vou te explicar direitinho... Olha que massa...

[5-6 parágrafos MUITO desenvolvidos]
- "Tipo assim", "Na real", "Vou te contar"
- MUITOS exemplos práticos
- Traduz tudo: "X (que na real significa Y)"
- Tom de amiga contando história

[SACOU? 💡]
Resumindo: [frase ultra-simples]
[/SACOU?]

## 🔍 Mais Detalhes (Peraí Que Tem Mais!)

Peraí que tem mais coisa massa...

[3-4 parágrafos com mais exemplos]
- Situações do dia a dia
- Mais analogias modernas
- Tom sempre conversacional

[FICA LIGADO! ⚠️]
Ó, não confunde [pegadinha comum]!
[/FICA LIGADO!]

[QUESTOES_CLICAVEIS]
["Pergunta 1?","Pergunta 2?","Pergunta 3?"]
[/QUESTOES_CLICAVEIS]

🚫 SE NÃO TIVER GÍRIAS EM TODO PARÁGRAFO, VOCÊ FALHOU!
✅ Tom de áudio de WhatsApp SEMPRE
✅ Começa frases com "mano", "cara", "olha"
✅ MUITOS exemplos práticos

${cfContext || ''}`;
        } else if (level === 'deep') {
          systemPrompt = `🚨 ÁUDIO LONGO DE WHATSAPP - MODO MEGA DESCOMPLICADO APROFUNDADO

${BLOCOS_BASE.vozDescomplicada}

${BLOCOS_BASE.componentesDescomplicado}

${BLOCOS_BASE.regrasFormatacao}

${BLOCOS_BASE.questoesClicaveis}

⚠️ EXTENSÃO OBRIGATÓRIA - NÍVEL DEEP:
- MÍNIMO ${EXTENSAO_CONFIG.descomplicado.deep.caracteres[0]} caracteres
- IDEAL ${EXTENSAO_CONFIG.descomplicado.deep.caracteres[1]} caracteres
- ${EXTENSAO_CONFIG.descomplicado.deep.palavras[0]}-${EXTENSAO_CONFIG.descomplicado.deep.palavras[1]} palavras

🎯 VOCÊ ESTÁ MANDANDO UM ÁUDIO BEM LONGO EXPLICANDO TUDO:

OBRIGATÓRIO EM TODA RESPOSTA:
- Começa com "Cara," / "Mano," / "Bora lá"
- MUITAS gírias: "tipo", "sacou?", "massa", "olha só", "na moral", "peraí"
- Interjeições: "nossa", "caramba", "vou te falar", "olha que massa"
- Analogias MODERNAS constantes (TikTok, Netflix, Uber, Instagram, jogos)
- TODO termo jurídico traduzido NA HORA
- Tom de amiga super animada contando história longa

🎯 ESTRUTURA COMPLETA:

## 📚 [Título Chamativo]

Cara/Mano, senta que vou te explicar TUDO sobre [tema]!

[3-4 parágrafos super conversacionais]
- Gírias em TODO parágrafo
- Analogia moderna logo de cara
- Tom de áudio animado

[DICA DE OURO 💎]
Macete massa informal
[/DICA DE OURO]

## 💡 [Conceito Principal]

Agora vou destrinchar direitinho...

[5-6 parágrafos MUITO desenvolvidos]
- "Tipo assim", "olha só", "vou te falar"
- MUITAS analogias modernas
- Traduz tudo na hora

[SACOU? 💡]
Resumindo: [ultra-simples]
[/SACOU?]

## 🔍 [Detalhamento Mais Profundo]

Peraí que tem mais coisa importante...

[4-5 parágrafos aprofundando]
- Diferentes aspectos
- Mais exemplos práticos
- Sempre informal

[FICA LIGADO! ⚠️]
Ó, cuidado com [pegadinha]!
[/FICA LIGADO!]

## 📝 Exemplos Práticos (Olha Isso!)

Vou te dar uns exemplos massa...

[3-4 exemplos concretos SUPER desenvolvidos]
- Com nomes de pessoas
- Situações reais
- 2-3 parágrafos cada

[DICA DE OURO 💎]
Outra dica prática
[/DICA DE OURO]

## 🎯 Resumindo Tudo

Cara, então resumindo essa parada toda...

[2-3 parágrafos finais]
- Recapitula de forma simples
- Tom motivador

[QUESTOES_CLICAVEIS]
["Pergunta 1?","Pergunta 2?","Pergunta 3?"]
[/QUESTOES_CLICAVEIS]

🚫 FALHOU SE: Não tem gírias constantes, tem juridiquês sem tradução, tom formal
✅ Tom de áudio WhatsApp longo SEMPRE
✅ Mínimo 3 componentes visuais
✅ MUITOS exemplos práticos

${cfContext || ''}`;
        } else {
          // complete
          systemPrompt = `🚨 ÁUDIO MEGA LONGO DE WHATSAPP - MODO COMPLETO DESCOMPLICADO

${BLOCOS_BASE.vozDescomplicada}

${BLOCOS_BASE.componentesDescomplicado}

${BLOCOS_BASE.regrasFormatacao}

${BLOCOS_BASE.questoesClicaveis}

⚠️ EXTENSÃO OBRIGATÓRIA - NÍVEL COMPLETE:
- MÍNIMO ${EXTENSAO_CONFIG.descomplicado.complete.caracteres[0]} caracteres
- IDEAL ${EXTENSAO_CONFIG.descomplicado.complete.caracteres[1]} caracteres
- ${EXTENSAO_CONFIG.descomplicado.complete.palavras[0]}-${EXTENSAO_CONFIG.descomplicado.complete.palavras[1]} palavras

🎯 VOCÊ ESTÁ MANDANDO UM ÁUDIO MEGA COMPLETO:

É tipo aquele áudio de 10 minutos que você manda quando tem MUITO pra contar!

OBRIGATÓRIO:
- Começa animada: "Cara," / "Mano," / "Bora que vai ser longo!"
- TONELADAS de gírias em TODA resposta
- Interjeições naturais constantemente
- MUITAS analogias modernas (TikTok, Netflix, séries, jogos, Uber)
- TODO termo técnico vira linguagem simples NA HORA
- Tom de amiga super empolgada contando história LONGA

🎯 ESTRUTURA MÁXIMA:

## 📚 [Título Principal Chamativo]

Mano/Cara, pega seu fone que isso vai ser longo mas vai valer a pena!

[4-5 parágrafos super envolventes]
- Tom de áudio empolgado
- Gírias constantes
- Analogia logo de cara

[DICA DE OURO 💎]
Primeiro macete massa
[/DICA DE OURO]

## 💡 [Primeiro Conceito Grande]

Bora começar pelo começo...

[6-7 parágrafos MUITO desenvolvidos]
- "Tipo assim", "olha só"
- Muitas analogias
- Exemplos constantes

[SACOU? 💡]
Resumo do conceito 1
[/SACOU?]

## 🔍 [Segundo Conceito/Aspecto]

Agora vamos pra outra parte massa...

[5-6 parágrafos aprofundando]
- Outro ângulo do tema
- Mais exemplos
- Sempre informal

[FICA LIGADO! ⚠️]
Pegadinha importante!
[/FICA LIGADO!]

## 📝 [Terceiro Aspecto/Aplicação]

E olha só essa parte aqui...

[4-5 parágrafos aplicação prática]
- Como usa no dia a dia
- Exemplos concretos

[DICA DE OURO 💎]
Segundo macete
[/DICA DE OURO]

## 🎯 Casos Práticos Massa

Vou te dar vários exemplos...

[4-5 exemplos SUPER desenvolvidos]
- Com nomes de pessoas
- Situações detalhadas
- Cada um bem explicado

[SACOU? 💡]
Lição dos exemplos
[/SACOU?]

## 💭 Resumo Final (Fechando com Chave de Ouro)

Cara, resumindo tudo que a gente viu...

[3-4 parágrafos recapitulando]
- De forma super simples
- Tom motivador no final

[FICA LIGADO! ⚠️]
Último alerta importante
[/FICA LIGADO!]

[QUESTOES_CLICAVEIS]
["Pergunta 1?","Pergunta 2?","Pergunta 3?"]
[/QUESTOES_CLICAVEIS]

🚫 VOCÊ FALHOU SE: Tem menos de ${EXTENSAO_CONFIG.descomplicado.complete.caracteres[0]} caracteres, pouca gíria, tom formal

${cfContext || ''}`;
        }
      } else {
        // MODO TÉCNICO
        systemPrompt = `🎯 VOCÊ É A PROFESSORA JURÍDICA - MODO TÉCNICO

${BLOCOS_BASE.vozTecnica}

${BLOCOS_BASE.componentesTecnico}

${BLOCOS_BASE.regrasFormatacao}

⚠️ EXTENSÃO OBRIGATÓRIA:
- ${EXTENSAO_CONFIG.tecnico[level].caracteres[0]}-${EXTENSAO_CONFIG.tecnico[level].caracteres[1]} caracteres
- ${EXTENSAO_CONFIG.tecnico[level].palavras[0]}-${EXTENSAO_CONFIG.tecnico[level].palavras[1]} palavras

📚 LINGUAGEM TÉCNICA:
✅ Terminologia jurídica precisa
✅ Citações de doutrina e jurisprudência
✅ Referências normativas completas (Art. X, Lei Y)

[IMPORTANTE], [ATENÇÃO], [NOTA]

[QUESTOES_CLICAVEIS]
[\\"Questão técnica 1?\\",\\"Questão técnica 2?\\",\\"Questão técnica 3?\\\"]
[/QUESTOES_CLICAVEIS]

${cfContext || ''}`;
      }
    }

    // Validar arquivos
    if (files && files.length > 0) {
      for (const file of files) {
        const dataSize = file.data?.split(',')[1]?.length || 0;
        
        if (file.type.includes('image')) {
          console.log('✅ Imagem válida será enviada para Gemini');
        } else if (file.type.includes('pdf')) {
          console.log(`✅ PDF válido com ${dataSize} caracteres extraídos`);
        }
      }
    }

    // Converter mensagens para formato Gemini
    const geminiContents = [];
    
    const imageParts: any[] = [];
    if (files && files.length > 0) {
      for (const file of files) {
        if (file.type.includes('image')) {
          const base64Data = file.data.split(',')[1];
          const dataSize = base64Data?.length || 0;
          console.log(`🖼️ Adicionando imagem: ${file.type}, tamanho base64: ${dataSize} caracteres`);
          
          if (dataSize === 0) {
            console.error('❌ Imagem vazia ou inválida!');
            continue;
          }
          
          imageParts.push({
            inlineData: {
              mimeType: file.type,
              data: base64Data
            }
          });
        }
      }
      console.log(`✅ Total de imagens processadas: ${imageParts.length}`);
    }
    
    if (messages.length > 0 && messages[0].role === 'user') {
      const userParts: any[] = [{ text: systemPrompt + '\n\n---\n\n' + messages[0].content }];
      
      if (imageParts.length > 0) {
        userParts.push(...imageParts);
      }
      
      geminiContents.push({
        role: 'user',
        parts: userParts
      });
      
      for (let i = 1; i < messages.length; i++) {
        geminiContents.push({
          role: messages[i].role === 'user' ? 'user' : 'model',
          parts: [{ text: messages[i].content }]
        });
      }
    }

    const modoAtual = mode === 'lesson' ? 'lesson' : 
                      mode === 'recommendation' ? 'recommendation' : 
                      linguagemMode;
    const nivelAtual = mode === 'recommendation' && responseLevel !== 'complete' ? 'basic' :
                       responseLevel || 'complete';
    
    const config = EXTENSAO_CONFIG[modoAtual]?.[nivelAtual];
    
    const geminiPayload = {
      contents: geminiContents,
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        maxOutputTokens: linguagemMode === 'descomplicado' 
          ? ((config?.tokens || 3500) * 2)  // DOBRAR tokens para modo descomplicado forçar respostas longas
          : (config?.tokens || 3500)
      }
    };

    const acceptHeader = request.headers.get('Accept') || '';
    const wantsSSE = acceptHeader.includes('text/event-stream');
    
    const modelName = 'gemini-2.0-flash-exp';
    const endpoint = wantsSSE ? 'streamGenerateContent' : 'generateContent';
    
    const geminiUrl = wantsSSE 
      ? `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:${endpoint}?key=${DIREITO_PREMIUM_API_KEY}&alt=sse`
      : `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:${endpoint}?key=${DIREITO_PREMIUM_API_KEY}`;
    
    console.log('🤖 Chamando Gemini API...', {
      mode,
      linguagemMode,
      responseLevel,
      maxTokens: config?.tokens,
      expectedChars: config?.caracteres
    });
    
    const apiStartTime = Date.now();
    
    if (wantsSSE) {
      // Streaming
      const response = await fetch(geminiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Function-Revision': 'v4.0.0-2025-11-05T12:00Z',
          'X-Model': modelName
        },
        body: JSON.stringify(geminiPayload)
      });

      if (!response.ok || !response.body) {
        const errorText = await response.text();
        console.error('❌ Erro da API Gemini:', errorText);
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
      }

      console.log('📡 Enviando keepalive inicial...');
      
      const { readable, writable } = new TransformStream();
      const writer = writable.getWriter();
      const encoder = new TextEncoder();
      
      await writer.write(encoder.encode(': keepalive\n\n'));

      (async () => {
        try {
          const reader = response.body!.getReader();
          const decoder = new TextDecoder();
          let buffer = '';
          let fullText = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (!line.trim() || line.startsWith(':')) continue;
              
              if (line.startsWith('data: ')) {
                const jsonStr = line.slice(6);
                try {
                  const parsed = JSON.parse(jsonStr);
                  const content = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
                  
                  if (content) {
                    fullText += content;
                    
                    const sseEvent = {
                      choices: [{
                        delta: { content },
                        index: 0,
                        finish_reason: null
                      }]
                    };
                    
                    await writer.write(encoder.encode(`data: ${JSON.stringify(sseEvent)}\n\n`));
                  }
                } catch (e) {
                  console.error('Erro ao parsear JSON SSE:', e);
                }
              }
            }
          }

          // Validação final
          const wordCount = fullText.split(/\s+/).length;
          const charCount = fullText.length;
          const hasComponents = {
            dicaDeOuro: fullText.includes('[DICA DE OURO 💎]'),
            sacou: fullText.includes('[SACOU? 💡]'),
            ficaLigado: fullText.includes('[FICA LIGADO! ⚠️]'),
            questoes: fullText.includes('[QUESTOES_CLICAVEIS]')
          };
          
          console.log('✅ Streaming concluído:', {
            charCount,
            wordCount,
            expectedChars: config?.caracteres,
            hasComponents
          });
          
          if (linguagemMode === 'descomplicado' && responseLevel !== 'basic') {
            const minChars = config?.caracteres[0];
            if (charCount < minChars) {
              console.warn(`⚠️ Resposta muito curta! ${charCount} caracteres (mínimo: ${minChars})`);
            }
            if (!hasComponents.questoes) {
              console.warn('⚠️ Faltando [QUESTOES_CLICAVEIS]');
            }
          }

          const doneEvent = {
            choices: [{
              delta: {},
              index: 0,
              finish_reason: 'stop'
            }]
          };
          
          await writer.write(encoder.encode(`data: ${JSON.stringify(doneEvent)}\n\n`));
          await writer.write(encoder.encode('data: [DONE]\n\n'));
          console.log('✅ Enviando evento done, showActions: true');
          
        } catch (error) {
          console.error('Erro no streaming:', error);
        } finally {
          await writer.close();
          console.log('🔒 Fechando stream SSE');
        }
      })();

      const totalTime = Date.now() - startTime;
      console.log(`⏱️ Tempo total de processamento: ${totalTime}ms `);

      return new Response(readable, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        }
      });
      
    } else {
      // Resposta normal (não streaming)
      const geminiResponse = await fetch(geminiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Function-Revision': 'v4.0.0-2025-11-05T12:00Z',
          'X-Model': modelName
        },
        body: JSON.stringify(geminiPayload)
      });

      if (!geminiResponse.ok) {
        const errorText = await geminiResponse.text();
        console.error('❌ Erro da API Gemini:', errorText);
        throw new Error(`Gemini API error: ${geminiResponse.status} - ${errorText}`);
      }

      const geminiData = await geminiResponse.json();
      const fullResponse = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      const wordCount = fullResponse.split(/\s+/).length;
      const charCount = fullResponse.length;
      const hasComponents = {
        dicaDeOuro: fullResponse.includes('[DICA DE OURO 💎]'),
        sacou: fullResponse.includes('[SACOU? 💡]'),
        ficaLigado: fullResponse.includes('[FICA LIGADO! ⚠️]'),
        questoes: fullResponse.includes('[QUESTOES_CLICAVEIS]')
      };
      
      console.log('✅ Resposta do Gemini recebida:', {
        textLength: fullResponse.length,
        wordCount,
        charCount,
        expectedChars: config?.caracteres,
        hasComponents,
        preview: fullResponse.substring(0, 100)
      });
      
      if (linguagemMode === 'descomplicado' && responseLevel !== 'basic') {
        const minChars = config?.caracteres[0];
        if (charCount < minChars) {
          console.warn(`⚠️ Resposta muito curta! ${charCount} caracteres (mínimo: ${minChars})`);
        }
        if (!hasComponents.questoes) {
          console.warn('⚠️ Faltando [QUESTOES_CLICAVEIS]');
        }
        const componentCount = Object.values(hasComponents).filter(Boolean).length;
        if (componentCount < 3) {
          console.warn(`⚠️ Poucos componentes visuais! ${componentCount}/4 esperados`);
        }
      }

      const totalTime = Date.now() - startTime;
      console.log(`⏱️ Tempo total de processamento: ${totalTime}ms `);

      return new Response(
        JSON.stringify({ content: fullResponse }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('❌ Erro:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        details: error instanceof Error ? error.stack : undefined
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
