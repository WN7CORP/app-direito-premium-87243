import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, XCircle, ChevronRight, Trophy, RotateCcw, BookOpen, Volume2, Pause, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

interface Questao {
  id: number;
  enunciado: string;
  alternativa_a: string;
  alternativa_b: string;
  alternativa_c: string;
  alternativa_d: string;
  resposta_correta: string;
  comentario: string;
  subtema: string;
  exemplo_pratico?: string;
  url_audio?: string;
  url_imagem_exemplo?: string;
  url_audio_comentario?: string;
  url_audio_exemplo?: string;
}

interface QuestoesConcursoProps {
  questoes: Questao[];
  onFinish: () => void;
  area: string;
  tema: string;
}

const QuestoesConcurso = ({ questoes, onFinish, area, tema }: QuestoesConcursoProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState({ correct: 0, wrong: 0 });
  const [finished, setFinished] = useState(false);
  const [showExemplo, setShowExemplo] = useState(false);
  const [questoesState, setQuestoesState] = useState<Questao[]>(questoes);
  const [audioLoading, setAudioLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [shakeError, setShakeError] = useState(false);
  const [narrationLoading, setNarrationLoading] = useState(false);
  const [imagemLoading, setImagemLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const narrationAudioRef = useRef<HTMLAudioElement | null>(null);
  const exemploAudioStartedRef = useRef(false);

  const currentQuestion = questoesState[currentIndex];
  const progress = ((currentIndex + 1) / questoesState.length) * 100;
  const isCorrect = selectedAnswer === currentQuestion?.resposta_correta;

  // Shake animation variants
  const shakeVariants = {
    shake: {
      x: [0, -8, 8, -8, 8, -4, 4, 0],
      transition: { duration: 0.5 }
    },
    idle: { x: 0 }
  };

  // Função para narrar texto com cache opcional
  const narrarTexto = useCallback(async (
    texto: string, 
    questaoId?: number, 
    tipo?: 'comentario' | 'exemplo'
  ): Promise<void> => {
    return new Promise(async (resolve) => {
      try {
        // Parar narração anterior se existir
        if (narrationAudioRef.current) {
          narrationAudioRef.current.pause();
          narrationAudioRef.current = null;
        }

        setNarrationLoading(true);
        
        const { data, error } = await supabase.functions.invoke('gerar-narracao', {
          body: { texto, questaoId, tipo }
        });

        if (error || (!data?.audioBase64 && !data?.url_audio)) {
          console.error('Erro ao gerar narração:', error);
          setNarrationLoading(false);
          resolve();
          return;
        }

        // Se recebeu URL do cache, usar diretamente
        let audioUrl: string;
        if (data.url_audio) {
          audioUrl = data.url_audio;
          console.log(`Usando áudio do cache: ${audioUrl}, cached: ${data.cached}`);
          
          // Atualizar estado local com a URL do cache
          if (questaoId && tipo) {
            const colunaAudio = tipo === 'comentario' ? 'url_audio_comentario' : 'url_audio_exemplo';
            setQuestoesState(prev => prev.map(q => 
              q.id === questaoId ? { ...q, [colunaAudio]: audioUrl } : q
            ));
          }
        } else {
          // Fallback para base64 (caso antigo)
          audioUrl = `data:audio/mpeg;base64,${data.audioBase64}`;
        }

        const audio = new Audio(audioUrl);
        narrationAudioRef.current = audio;
        
        audio.onended = () => {
          setNarrationLoading(false);
          resolve();
        };
        
        audio.onerror = () => {
          setNarrationLoading(false);
          resolve();
        };

        await audio.play();
      } catch (err) {
        console.error('Erro na narração:', err);
        setNarrationLoading(false);
        resolve();
      }
    });
  }, []);

  // Scroll para o topo ao mudar de questão
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentIndex]);

  // Gerar ou reproduzir áudio ao entrar na questão
  useEffect(() => {
    const questaoAtual = questoesState[currentIndex];
    if (!questaoAtual) return;

    // Parar áudio anterior
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }

    if (questaoAtual.url_audio) {
      // Já tem áudio - reproduz automaticamente
      playAudio(questaoAtual.url_audio);
    } else {
      // Não tem - gerar em background
      gerarAudioParaQuestao(questaoAtual);
    }
  }, [currentIndex]);

  // Gerar imagem do exemplo prático
  const gerarImagemExemplo = useCallback(async (questao: Questao) => {
    if (!questao.exemplo_pratico || questao.url_imagem_exemplo || imagemLoading) return;
    
    setImagemLoading(true);
    console.log(`Gerando imagem para exemplo da questão ${questao.id}...`);

    try {
      const { data, error } = await supabase.functions.invoke('gerar-imagem-exemplo', {
        body: { 
          questaoId: questao.id, 
          exemploTexto: questao.exemplo_pratico 
        }
      });

      if (error) {
        console.error('Erro ao gerar imagem:', error);
        setImagemLoading(false);
        return;
      }

      if (data?.url_imagem) {
        setQuestoesState(prev => prev.map(q => 
          q.id === questao.id ? { ...q, url_imagem_exemplo: data.url_imagem } : q
        ));
        console.log(`Imagem gerada: ${data.url_imagem}, cached: ${data.cached}`);
      }
    } catch (err) {
      console.error('Erro ao chamar função de imagem:', err);
    } finally {
      setImagemLoading(false);
    }
  }, [imagemLoading]);

  // Narrar exemplo e gerar imagem quando drawer abrir
  useEffect(() => {
    if (showExemplo && currentQuestion?.exemplo_pratico) {
      // Parar áudio principal se estiver tocando
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
      
      // Gerar imagem se não existir
      if (!currentQuestion.url_imagem_exemplo) {
        gerarImagemExemplo(currentQuestion);
      }
      
      // Só iniciar áudio se ainda não foi iniciado nesta abertura do drawer
      if (!exemploAudioStartedRef.current) {
        exemploAudioStartedRef.current = true;
        
        // Verificar se já tem áudio do exemplo no cache local
        if (currentQuestion.url_audio_exemplo) {
          // Usar áudio do cache diretamente
          const audio = new Audio(currentQuestion.url_audio_exemplo);
          narrationAudioRef.current = audio;
          setNarrationLoading(true);
          audio.onended = () => setNarrationLoading(false);
          audio.onerror = () => setNarrationLoading(false);
          audio.play().catch(() => setNarrationLoading(false));
        } else {
          // Gerar novo áudio e salvar no cache
          const exemploTexto = `Exemplo prático. ${currentQuestion.exemplo_pratico}`;
          narrarTexto(exemploTexto, currentQuestion.id, 'exemplo');
        }
      }
    } else if (!showExemplo) {
      // Resetar flag quando fechar o drawer
      exemploAudioStartedRef.current = false;
      
      if (narrationAudioRef.current) {
        narrationAudioRef.current.pause();
        narrationAudioRef.current = null;
        setNarrationLoading(false);
      }
    }
  }, [showExemplo, currentQuestion?.exemplo_pratico, currentQuestion?.url_imagem_exemplo, currentQuestion?.id, narrarTexto, gerarImagemExemplo]);

  const gerarAudioParaQuestao = async (questao: Questao) => {
    if (audioLoading) return;
    
    setAudioLoading(true);
    console.log(`Gerando áudio para questão ${questao.id}...`);

    try {
      const { data, error } = await supabase.functions.invoke('gerar-audio-questao', {
        body: { 
          questaoId: questao.id, 
          texto: questao.enunciado 
        }
      });

      if (error) {
        console.error('Erro ao gerar áudio:', error);
        setAudioLoading(false);
        return;
      }

      if (data?.url_audio) {
        // Atualizar questão local com URL
        setQuestoesState(prev => prev.map(q => 
          q.id === questao.id ? { ...q, url_audio: data.url_audio } : q
        ));
        // Reproduzir automaticamente
        playAudio(data.url_audio);
      }
    } catch (err) {
      console.error('Erro ao chamar função de áudio:', err);
    } finally {
      setAudioLoading(false);
    }
  };

  const playAudio = (url: string) => {
    if (audioRef.current) {
      audioRef.current.src = url;
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((err) => {
        console.log('Autoplay bloqueado pelo navegador:', err);
        setIsPlaying(false);
      });
    }
  };

  const toggleAudio = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      const url = currentQuestion?.url_audio;
      if (url) {
        if (audioRef.current.src !== url) {
          audioRef.current.src = url;
        }
        audioRef.current.play().then(() => {
          setIsPlaying(true);
        }).catch(console.error);
      } else if (!audioLoading) {
        // Se não tem URL ainda, gerar
        gerarAudioParaQuestao(currentQuestion);
      }
    }
  };

  const alternatives = [
    { key: "A", value: currentQuestion?.alternativa_a },
    { key: "B", value: currentQuestion?.alternativa_b },
    { key: "C", value: currentQuestion?.alternativa_c },
    { key: "D", value: currentQuestion?.alternativa_d },
  ];

  const handleSelectAnswer = async (answer: string) => {
    if (showResult) return;
    
    // Parar áudio do enunciado
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
    
    setSelectedAnswer(answer);
    setShowResult(true);

    const correct = answer === currentQuestion.resposta_correta;
    setScore(prev => ({
      correct: prev.correct + (correct ? 1 : 0),
      wrong: prev.wrong + (correct ? 0 : 1)
    }));

    // Atualiza estatísticas no banco
    try {
      await supabase.rpc("incrementar_stats_questao", {
        p_questao_id: currentQuestion.id,
        p_correta: correct
      });
    } catch (error) {
      console.error("Erro ao atualizar stats:", error);
    }

    // Narração de feedback
    if (correct) {
      await narrarTexto("Resposta correta!");
      // Aguarda um pouco e narra o comentário com cache
      if (currentQuestion.comentario) {
        setTimeout(() => {
          // Verificar se já tem áudio do comentário no cache local
          if (currentQuestion.url_audio_comentario) {
            const audio = new Audio(currentQuestion.url_audio_comentario);
            narrationAudioRef.current = audio;
            setNarrationLoading(true);
            audio.onended = () => setNarrationLoading(false);
            audio.onerror = () => setNarrationLoading(false);
            audio.play().catch(() => setNarrationLoading(false));
          } else {
            narrarTexto(currentQuestion.comentario, currentQuestion.id, 'comentario');
          }
        }, 500);
      }
    } else {
      // Tremor de tela ao errar
      setShakeError(true);
      setTimeout(() => setShakeError(false), 600);
      
      await narrarTexto("Resposta incorreta.");
      // Aguarda e narra o comentário também com cache
      if (currentQuestion.comentario) {
        setTimeout(() => {
          if (currentQuestion.url_audio_comentario) {
            const audio = new Audio(currentQuestion.url_audio_comentario);
            narrationAudioRef.current = audio;
            setNarrationLoading(true);
            audio.onended = () => setNarrationLoading(false);
            audio.onerror = () => setNarrationLoading(false);
            audio.play().catch(() => setNarrationLoading(false));
          } else {
            narrarTexto(currentQuestion.comentario, currentQuestion.id, 'comentario');
          }
        }, 500);
      }
    }
  };

  const handleNext = () => {
    // Parar qualquer narração em andamento
    if (narrationAudioRef.current) {
      narrationAudioRef.current.pause();
      narrationAudioRef.current = null;
    }
    
    if (currentIndex < questoesState.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
      setShowExemplo(false);
    } else {
      setFinished(true);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setScore({ correct: 0, wrong: 0 });
    setFinished(false);
    setShowExemplo(false);
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
    if (narrationAudioRef.current) {
      narrationAudioRef.current.pause();
      narrationAudioRef.current = null;
    }
  };

  if (finished) {
    const percentage = Math.round((score.correct / questoesState.length) * 100);
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex-1 flex flex-col items-center justify-center p-6 gap-6"
      >
        <div className={cn(
          "w-20 h-20 rounded-full flex items-center justify-center",
          percentage >= 70 ? "bg-emerald-500/20" : percentage >= 50 ? "bg-amber-500/20" : "bg-destructive/20"
        )}>
          <Trophy className={cn(
            "w-10 h-10",
            percentage >= 70 ? "text-emerald-500" : percentage >= 50 ? "text-amber-500" : "text-destructive"
          )} />
        </div>
        
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Quiz Finalizado!</h2>
          <p className="text-muted-foreground mb-4">{tema}</p>
        </div>

        <div className="flex gap-8 text-center">
          <div>
            <div className="text-3xl font-bold text-emerald-500">{score.correct}</div>
            <div className="text-sm text-muted-foreground">Acertos</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-destructive">{score.wrong}</div>
            <div className="text-sm text-muted-foreground">Erros</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-primary">{percentage}%</div>
            <div className="text-sm text-muted-foreground">Aproveitamento</div>
          </div>
        </div>

        <div className="flex gap-3 mt-4">
          <Button variant="outline" onClick={handleRestart}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Refazer
          </Button>
          <Button onClick={onFinish}>
            Continuar
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <>
      <motion.div 
        ref={containerRef} 
        className="flex-1 flex flex-col overflow-y-auto"
        variants={shakeVariants}
        animate={shakeError ? "shake" : "idle"}
      >
        {/* Progress */}
        <div className="px-4 py-3 border-b">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">
              Questão {currentIndex + 1} de {questoesState.length}
            </span>
            <span className="font-medium">
              {score.correct} ✓ / {score.wrong} ✗
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Question */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {/* Subtema */}
              {currentQuestion?.subtema && (
                <div className="text-xs text-primary font-medium mb-2 uppercase tracking-wide">
                  {currentQuestion.subtema}
                </div>
              )}

              {/* Enunciado com botão de áudio */}
              <div className="bg-card rounded-xl p-4 border mb-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm leading-relaxed flex-1">{currentQuestion?.enunciado}</p>
                  
                  {/* Botão de áudio */}
                  <button 
                    onClick={toggleAudio}
                    disabled={audioLoading}
                    className={cn(
                      "shrink-0 p-2.5 rounded-full transition-all",
                      audioLoading 
                        ? "bg-muted cursor-wait" 
                        : isPlaying 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-primary/10 hover:bg-primary/20 text-primary"
                    )}
                    title={audioLoading ? "Gerando áudio..." : isPlaying ? "Pausar" : "Ouvir questão"}
                  >
                    {audioLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : isPlaying ? (
                      <Pause className="w-5 h-5" />
                    ) : (
                      <Volume2 className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Alternativas */}
              <div className="space-y-2">
                {alternatives.map((alt) => {
                  const isSelected = selectedAnswer === alt.key;
                  const isCorrectAnswer = alt.key === currentQuestion?.resposta_correta;
                  
                  let bgClass = "bg-card hover:bg-accent";
                  let borderClass = "border-border";
                  
                  if (showResult) {
                    if (isCorrectAnswer) {
                      bgClass = "bg-emerald-500/10";
                      borderClass = "border-emerald-500";
                    } else if (isSelected && !isCorrectAnswer) {
                      bgClass = "bg-destructive/10";
                      borderClass = "border-destructive";
                    }
                  } else if (isSelected) {
                    bgClass = "bg-primary/10";
                    borderClass = "border-primary";
                  }

                  return (
                    <button
                      key={alt.key}
                      onClick={() => handleSelectAnswer(alt.key)}
                      disabled={showResult}
                      className={cn(
                        "w-full flex items-start gap-3 p-4 rounded-xl border transition-all text-left",
                        bgClass,
                        borderClass,
                        !showResult && "active:scale-[0.98]"
                      )}
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center font-semibold text-sm shrink-0",
                        showResult && isCorrectAnswer 
                          ? "bg-emerald-500 text-white" 
                          : showResult && isSelected && !isCorrectAnswer
                          ? "bg-destructive text-white"
                          : isSelected
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      )}>
                        {showResult && isCorrectAnswer ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : showResult && isSelected && !isCorrectAnswer ? (
                          <XCircle className="w-5 h-5" />
                        ) : (
                          alt.key
                        )}
                      </div>
                      <span className="text-sm flex-1 pt-1">{alt.value}</span>
                    </button>
                  );
                })}
              </div>

              {/* Comentário */}
              {showResult && currentQuestion?.comentario && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "mt-4 p-4 rounded-xl border",
                    isCorrect ? "bg-emerald-500/10 border-emerald-500/30" : "bg-amber-500/10 border-amber-500/30"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {isCorrect ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-amber-500" />
                      )}
                      <span className="font-semibold text-sm">
                        {isCorrect ? "Parabéns! Resposta correta!" : "Resposta incorreta"}
                      </span>
                      {narrationLoading && (
                        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                      )}
                    </div>
                    
                    {/* Botão Ver Exemplo */}
                    {currentQuestion?.exemplo_pratico && (
                      <Button 
                        variant="secondary" 
                        size="sm"
                        onClick={() => setShowExemplo(true)}
                        className="bg-amber-500/20 text-amber-500 hover:bg-amber-500/30 border border-amber-500/40"
                      >
                        <BookOpen className="w-4 h-4 mr-1" />
                        Ver Exemplo
                      </Button>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {currentQuestion.comentario}
                  </p>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        {showResult && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 border-t bg-background"
          >
            <Button onClick={handleNext} className="w-full" size="lg">
              {currentIndex < questoesState.length - 1 ? (
                <>
                  Próxima Questão
                  <ChevronRight className="w-5 h-5 ml-2" />
                </>
              ) : (
                <>
                  Ver Resultado
                  <Trophy className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
          </motion.div>
        )}
      </motion.div>

      {/* Audio element */}
      <audio 
        ref={audioRef} 
        onEnded={() => setIsPlaying(false)}
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
      />

      {/* Drawer de Exemplo Prático */}
      <Drawer open={showExemplo} onOpenChange={setShowExemplo}>
        <DrawerContent>
          <DrawerHeader className="text-left">
            <DrawerTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              Exemplo Prático
              {narrationLoading && (
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              )}
            </DrawerTitle>
            <DrawerDescription>
              Veja como esse conceito se aplica na prática
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-4 space-y-3">
            {/* Imagem ilustrativa */}
            {currentQuestion?.url_imagem_exemplo ? (
              <div className="rounded-xl overflow-hidden border">
                <img 
                  src={currentQuestion.url_imagem_exemplo} 
                  alt="Ilustração do exemplo prático" 
                  className="w-full h-48 object-cover"
                />
              </div>
            ) : imagemLoading && (
              <div className="h-48 rounded-xl bg-muted flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">Gerando ilustração...</span>
              </div>
            )}
            
            {/* Texto do exemplo */}
            <div className="bg-muted/50 rounded-xl p-4 border">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {currentQuestion?.exemplo_pratico}
              </p>
            </div>
          </div>
          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="outline" className="w-full">
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Entendi
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
};

export default QuestoesConcurso;
