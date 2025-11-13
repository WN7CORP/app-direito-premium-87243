import { useState, useRef, useEffect } from "react";
import { X, Send, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AssistantMessage } from "./AssistantMessage";
interface Message {
  role: "user" | "assistant";
  content: string;
  suggestions?: string[];
  showActions?: boolean;
}
interface PerguntaModalProps {
  isOpen: boolean;
  onClose: () => void;
  artigo: string;
  numeroArtigo: string;
}
const PerguntaModal = ({
  isOpen,
  onClose,
  artigo,
  numeroArtigo
}: PerguntaModalProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [linguagemMode, setLinguagemMode] = useState<'descomplicado' | 'tecnico'>('descomplicado');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const {
    toast
  } = useToast();
  const perguntasProntas = ["O que significa este artigo na prática?", "Quais são as exceções ou ressalvas deste artigo?", "Como este artigo se aplica em casos reais?", "Este artigo tem relação com outros artigos?"];
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth"
    });
  }, [messages]);
  const enviarPergunta = async (pergunta: string) => {
    if (!pergunta.trim() || loading) return;
    
    const userMessage: Message = {
      role: "user",
      content: pergunta
    };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      // Preparar mensagens no formato esperado pela edge function
      let contextualPrompt = '';
      
      if (linguagemMode === 'descomplicado') {
        contextualPrompt = `Você é a melhor amiga do estudante explicando direito de forma MEGA DESCOMPLICADA.

TOM OBRIGATÓRIO - ÁUDIO DE WHATSAPP:
- Fale como se estivesse mandando áudio no WhatsApp para amiga de 16 anos
- Use MUITAS gírias: "mano", "cara", "tipo", "sacou?", "massa", "olha só", "na moral"
- Interjeições: "nossa", "caramba", "sério", "viu?", "peraí", "olha que massa"
- Começa com: "Cara/Mano, vou te explicar..."
- TODO termo jurídico traduzido na hora: "X (que na real significa Y)"
- Analogias MODERNAS: TikTok, Instagram, Netflix, Uber, jogos
- Tom empolgado, tipo contando história massa

❌ PROIBIDO: juridiquês, "cumpre salientar", tom formal, respostas curtas

O estudante tá vendo este artigo:
Art. ${numeroArtigo} - ${artigo}

Pergunta dele: ${pergunta}

Explica de um jeito que até quem nunca estudou direito vai entender! Usa gírias e conta como se fosse uma história interessante!`;
      } else {
        contextualPrompt = `Você é um assistente jurídico especialista e didático. 

O estudante está analisando o seguinte artigo:

Art. ${numeroArtigo}
${artigo}

Responda de forma clara, técnica e precisa. Use terminologia jurídica apropriada e exemplos práticos quando relevante.

Pergunta do estudante: ${pergunta}`;
      }
      
      const allMessages = [
        ...messages,
        {
          role: "user" as const,
          content: contextualPrompt
        }
      ];

      const session = await supabase.auth.getSession();
      
      // Fazer chamada com streaming SSE
      const response = await fetch(
        `https://izspjvegxdfgkgibpyst.supabase.co/functions/v1/chat-professora`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'text/event-stream',
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6c3BqdmVneGRmZ2tnaWJweXN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxNDA2MTQsImV4cCI6MjA2MDcxNjYxNH0.LwTMbDH-S0mBoiIxfrSH2BpUMA7r4upOWWAb5a_If0Y',
            'Authorization': `Bearer ${session.data.session?.access_token || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6c3BqdmVneGRmZ2tnaWJweXN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxNDA2MTQsImV4cCI6MjA2MDcxNjYxNH0.LwTMbDH-S0mBoiIxfrSH2BpUMA7r4upOWWAb5a_If0Y'}`
          },
          body: JSON.stringify({
            messages: allMessages.map(m => ({
              role: m.role,
              content: m.content
            })),
            files: [],
            mode: 'study',
            responseLevel: 'complete',
            linguagemMode: linguagemMode
          })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Edge function error:', response.status, errorText);
        if (response.status === 429) {
          throw new Error('⏱️ Limite de perguntas atingido. Aguarde alguns minutos.');
        }
        throw new Error(`Erro ao processar pergunta (${response.status})`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = '';
      let buffer = '';

      // Criar mensagem do assistente vazia
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "",
        suggestions: []
      }]);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith(':')) continue;

            let payloadStr = trimmed;
            if (trimmed.startsWith('data:')) {
              payloadStr = trimmed.slice(5).trim();
              if (payloadStr === '[DONE]') continue;
            }

            try {
              const parsed = JSON.parse(payloadStr);
              const content = parsed?.content || '';
              
              if (content) {
                accumulatedText += content;
                
                // Atualizar mensagem em tempo real
                setMessages(prev => {
                  const newMessages = [...prev];
                  newMessages[newMessages.length - 1] = {
                    role: 'assistant',
                    content: accumulatedText,
                    suggestions: parsed?.suggestions || [],
                    showActions: false
                  };
                  return newMessages;
                });
              }

              // Verificar se terminou
              if (parsed?.done) {
                // Atualizar para mostrar ações
                setMessages(prev => {
                  const newMessages = [...prev];
                  newMessages[newMessages.length - 1] = {
                    ...newMessages[newMessages.length - 1],
                    showActions: true
                  };
                  return newMessages;
                });
                break;
              }
            } catch (parseError) {
              console.warn('Erro ao parsear linha SSE:', parseError);
            }
          }
        }

        // Se não recebeu conteúdo, mostrar erro
        if (!accumulatedText) {
          throw new Error('Não foi possível gerar resposta');
        }
      }
    } catch (error: any) {
      console.error("Erro ao enviar pergunta:", error);

      const errorMsg = error?.message || String(error);
      let description = "Não foi possível enviar sua pergunta. Tente novamente.";
      
      if (errorMsg.includes("429") || errorMsg.includes("quota") || errorMsg.includes("limit")) {
        description = "⏱️ Limite de perguntas atingido. Aguarde alguns minutos.";
      }

      toast({
        title: "Erro",
        description,
        variant: "destructive"
      });

      // Remover mensagem do assistente se houver erro
      setMessages(prev => {
        if (prev[prev.length - 1]?.role === 'assistant' && !prev[prev.length - 1]?.content) {
          return prev.slice(0, -1);
        }
        return prev;
      });
    } finally {
      setLoading(false);
    }
  };
  const handleClose = () => {
    setMessages([]);
    setInput("");
    onClose();
  };
  if (!isOpen) return null;
  return <div className="fixed inset-0 bg-background z-[100] flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 px-4 py-4 border-b border-border/50 bg-secondary/30">
        <Button variant="ghost" size="icon" onClick={handleClose} className="hover:bg-secondary">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </Button>
        <div className="flex-1">
          <h2 className="text-lg font-bold text-yellow-500">💬 Assistente Jurídico</h2>
          <p className="text-sm text-foreground/70">Art. {numeroArtigo}</p>
          
          {/* Toggle Descomplicado/Técnico */}
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={() => setLinguagemMode('descomplicado')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                linguagemMode === 'descomplicado'
                  ? 'bg-yellow-500 text-black'
                  : 'bg-secondary/50 text-foreground/60'
              }`}
            >
              😊 Descomplicado
            </button>
            <button
              onClick={() => setLinguagemMode('tecnico')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                linguagemMode === 'tecnico'
                  ? 'bg-yellow-500 text-black'
                  : 'bg-secondary/50 text-foreground/60'
              }`}
            >
              👔 Técnico
            </button>
          </div>
        </div>
      </div>

      {/* Messages - Layout mais largo */}
      <div className="flex-1 overflow-y-auto px-4 py-4 bg-secondary/20">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.length === 0 ? <div className="text-center py-8">
              <div className="text-5xl mb-4">🤔</div>
              <h3 className="text-lg font-bold text-foreground mb-2">
                Tire suas dúvidas sobre este artigo
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                Selecione uma pergunta pronta ou digite sua própria dúvida
              </p>
              
              {/* Perguntas Prontas */}
              <div className="grid grid-cols-1 gap-2">
                {perguntasProntas.map((pergunta, idx) => <button key={idx} onClick={() => enviarPergunta(pergunta)} disabled={loading} className="text-left px-4 py-3 rounded-lg bg-secondary/50 hover:bg-secondary border border-border/50 hover:border-yellow-500/50 transition-all text-sm text-foreground">
                    {pergunta}
                  </button>)}
              </div>
            </div> : <>
              {messages.map((msg, idx) => <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`w-full rounded-lg px-4 py-3 ${msg.role === "user" ? "bg-yellow-500/20 text-foreground border border-yellow-500/30" : "bg-secondary/50 text-foreground border border-border/30"}`}>
                    {msg.role === "assistant" ? (
                      <>
                        <AssistantMessage 
                          content={msg.content}
                          onAskSuggestion={(suggestion) => enviarPergunta(suggestion)}
                        />
                        
                        {/* Botões de ação após resposta completa */}
                        {msg.showActions && msg.content && (
                          <div className="mt-4 pt-4 border-t border-border/30 space-y-3">
                            {/* Botão Aprofundar */}
                            <button
                              onClick={() => enviarPergunta("Aprofunde mais nesse assunto, explicando detalhes que não foram mencionados")}
                              disabled={loading}
                              className="w-full px-4 py-2.5 rounded-lg bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 hover:border-yellow-500/50 transition-all text-sm font-medium text-foreground flex items-center justify-center gap-2"
                            >
                              <span>🔍</span>
                              Aprofundar mais
                            </button>
                            
                            {/* Sugestões de perguntas */}
                            <div className="space-y-2">
                              <p className="text-xs text-muted-foreground font-medium">💡 Perguntas relacionadas:</p>
                              <div className="grid grid-cols-1 gap-2">
                                <button
                                  onClick={() => enviarPergunta("Como isso se aplica na prática?")}
                                  disabled={loading}
                                  className="text-left px-3 py-2 rounded-lg bg-secondary/30 hover:bg-secondary/50 border border-border/30 hover:border-yellow-500/30 transition-all text-xs text-foreground"
                                >
                                  Como isso se aplica na prática?
                                </button>
                                <button
                                  onClick={() => enviarPergunta("Quais as exceções ou casos especiais?")}
                                  disabled={loading}
                                  className="text-left px-3 py-2 rounded-lg bg-secondary/30 hover:bg-secondary/50 border border-border/30 hover:border-yellow-500/30 transition-all text-xs text-foreground"
                                >
                                  Quais as exceções ou casos especiais?
                                </button>
                                <button
                                  onClick={() => enviarPergunta("Tem algum exemplo real desse artigo sendo usado?")}
                                  disabled={loading}
                                  className="text-left px-3 py-2 rounded-lg bg-secondary/30 hover:bg-secondary/50 border border-border/30 hover:border-yellow-500/30 transition-all text-xs text-foreground"
                                >
                                  Tem algum exemplo real desse artigo sendo usado?
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-sm">{msg.content}</p>
                    )}
                  </div>
                </div>)}
              {loading && <div className="flex justify-start w-full">
                  <div className="bg-secondary/50 border border-border/30 rounded-lg px-4 py-3">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce" style={{
                animationDelay: "0ms"
              }} />
                      <div className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce" style={{
                animationDelay: "150ms"
              }} />
                      <div className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce" style={{
                animationDelay: "300ms"
              }} />
                    </div>
                  </div>
                </div>}
            <div ref={messagesEndRef} />
          </>}
        </div>
      </div>

      {/* Input */}
      <div className="px-4 py-4 border-t border-border/50 bg-secondary/30">
        <div className="flex gap-2 max-w-4xl mx-auto">
          <input type="text" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            enviarPergunta(input);
          }
        }} placeholder="Digite sua pergunta..." className="flex-1 bg-input text-foreground px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 border border-border/50" disabled={loading} />
          <Button onClick={() => enviarPergunta(input)} disabled={loading || !input.trim()} className="bg-yellow-500 hover:bg-yellow-600 text-black px-6">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>;
};
export default PerguntaModal;