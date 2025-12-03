import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, XCircle, ChevronRight, Trophy, RotateCcw, BookOpen, Volume2, Pause, Loader2, MessageSquare } from "lucide-react";
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
  const [comentarioAudioLoading, setComentarioAudioLoading] = useState(false);
  const [exemploAudioLoading, setExemploAudioLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const narrationAudioRef = useRef<HTMLAudioElement | null>(null);

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
  ): Promise<string | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('gerar-narracao', {
        body: { texto, questaoId, tipo }
      });

      if (error || (!data?.audioBase64 && !data?.url_audio)) {
        console.error('Erro ao gerar narração:', error);
        return null;
      }

      // Se recebeu URL do cache, usar diretamente
      let audioUrl: string;
      if (data.url_audio) {
        audioUrl = data.url_audio;
        console.log(`Áudio gerado/cache: ${audioUrl}, cached: ${data.cached}`);
        
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

      return audioUrl;
    } catch (err) {
      console.error('Erro na narração:', err);
      return null;
    }
  }, []);

  // Scroll para o topo ao mudar de questão
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentIndex]);

  // Gerar ou reproduzir áudio do ENUNCIADO ao entrar na questão (único autoplay)
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

  // Gerar imagem do exemplo prático (sem auto-play de áudio)
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

  // Gerar imagem quando drawer abrir (sem autoplay de áudio)
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
    } else if (!showExemplo) {
      // Parar narração ao fechar drawer
      if (narrationAudioRef.current) {
        narrationAudioRef.current.pause();
        narrationAudioRef.current = null;
        setNarrationLoading(false);
      }
    }
  }, [showExemplo, currentQuestion?.exemplo_pratico, currentQuestion?.url_imagem_exemplo, currentQuestion?.id, gerarImagemExemplo]);

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

  // Função para tocar áudio do comentário manualmente
  const tocarAudioComentario = async () => {
    if (!currentQuestion?.comentario || comentarioAudioLoading) return;
    
    // Parar qualquer áudio em andamento
    if (narrationAudioRef.current) {
      narrationAudioRef.current.pause();
      narrationAudioRef.current = null;
    }
    
    setComentarioAudioLoading(true);
    
    let audioUrl = currentQuestion.url_audio_comentario;
    
    // Se não tem URL, gerar
    if (!audioUrl) {
      audioUrl = await narrarTexto(currentQuestion.comentario, currentQuestion.id, 'comentario');
    }
    
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      narrationAudioRef.current = audio;
      audio.onended = () => setComentarioAudioLoading(false);
      audio.onerror = () => setComentarioAudioLoading(false);
      audio.play().catch(() => setComentarioAudioLoading(false));
    } else {
      setComentarioAudioLoading(false);
    }
  };

  // Função para tocar áudio do exemplo prático manualmente
  const tocarAudioExemplo = async () => {
    if (!currentQuestion?.exemplo_pratico || exemploAudioLoading) return;
    
    // Parar qualquer áudio em andamento
    if (narrationAudioRef.current) {
      narrationAudioRef.current.pause();
      narrationAudioRef.current = null;
    }
    
    setExemploAudioLoading(true);
    
    let audioUrl = currentQuestion.url_audio_exemplo;
    
    // Se não tem URL, gerar
    if (!audioUrl) {
      const exemploTexto = `Exemplo prático. ${currentQuestion.exemplo_pratico}`;
      audioUrl = await narrarTexto(exemploTexto, currentQuestion.id, 'exemplo');
    }
    
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      narrationAudioRef.current = audio;
      audio.onended = () => setExemploAudioLoading(false);
      audio.onerror = () => setExemploAudioLoading(false);
      audio.play().catch(() => setExemploAudioLoading(false));
    } else {
      setExemploAudioLoading(false);
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

    // Tremor de tela ao errar
    if (!correct) {
      setShakeError(true);
      setTimeout(() => setShakeError(false), 600);
    }
    
    // Não reproduz áudio automaticamente - usuário clica no botão
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

        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">Quiz Finalizado!</h2>
          <p className="text-muted-foreground">
            Você acertou {score.correct} de {questoesState.length} questões ({percentage}%)
          </p>
        </div>

        <div className="flex gap-3 w-full max-w-xs">
          <div className="flex-1 p-4 rounded-lg bg-emerald-500/10 text-center">
            <p className="text-2xl font-bold text-emerald-500">{score.correct}</p>
            <p className="text-xs text-muted-foreground">Acertos</p>
          </div>
          <div className="flex-1 p-4 rounded-lg bg-destructive/10 text-center">
            <p className="text-2xl font-bold text-destructive">{score.wrong}</p>
            <p className="text-xs text-muted-foreground">Erros</p>
          </div>
        </div>

        <div className="flex gap-3 mt-4">
          <Button variant="outline" onClick={handleRestart}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Refazer
          </Button>
          <Button onClick={onFinish}>
            Voltar ao Menu
          </Button>
        </div>
      </motion.div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground">Nenhuma questão disponível</p>
      </div>
    );
  }

  return (
    <motion.div
      variants={shakeVariants}
      animate={shakeError ? "shake" : "idle"}
      ref={containerRef}
      className="flex-1 flex flex-col overflow-y-auto"
    >
      {/* Header com progresso */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b p-4 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Questão {currentIndex + 1} de {questoesState.length}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-emerald-500 font-medium">{score.correct}</span>
            <span className="text-muted-foreground">/</span>
            <span className="text-destructive font-medium">{score.wrong}</span>
          </div>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Conteúdo da questão */}
      <div className="flex-1 p-4 space-y-6">
        {/* Subtema e Tema */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
            {area}
          </span>
          <span className="px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded-full">
            {tema}
          </span>
          {currentQuestion.subtema && (
            <span className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded-full">
              {currentQuestion.subtema}
            </span>
          )}
        </div>

        {/* Enunciado com botão de áudio */}
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <p className="text-lg leading-relaxed flex-1">{currentQuestion.enunciado}</p>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleAudio}
              disabled={audioLoading}
              className="shrink-0"
            >
              {audioLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Alternativas */}
        <div className="space-y-3">
          {alternatives.map((alt) => {
            const isSelected = selectedAnswer === alt.key;
            const isCorrectAnswer = alt.key === currentQuestion.resposta_correta;
            
            let buttonStyle = "border-border hover:border-primary hover:bg-primary/5";
            
            if (showResult) {
              if (isCorrectAnswer) {
                buttonStyle = "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400";
              } else if (isSelected && !isCorrectAnswer) {
                buttonStyle = "border-destructive bg-destructive/10 text-destructive";
              } else {
                buttonStyle = "border-border opacity-50";
              }
            } else if (isSelected) {
              buttonStyle = "border-primary bg-primary/10";
            }

            return (
              <motion.button
                key={alt.key}
                onClick={() => handleSelectAnswer(alt.key)}
                disabled={showResult}
                className={cn(
                  "w-full p-4 rounded-lg border-2 text-left transition-all",
                  "flex items-start gap-3",
                  buttonStyle
                )}
                whileTap={!showResult ? { scale: 0.98 } : {}}
              >
                <span className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-semibold text-sm",
                  showResult && isCorrectAnswer ? "bg-emerald-500 text-white" :
                  showResult && isSelected && !isCorrectAnswer ? "bg-destructive text-white" :
                  "bg-muted"
                )}>
                  {showResult && isCorrectAnswer ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : showResult && isSelected && !isCorrectAnswer ? (
                    <XCircle className="w-5 h-5" />
                  ) : (
                    alt.key
                  )}
                </span>
                <span className="flex-1 pt-1">{alt.value}</span>
              </motion.button>
            );
          })}
        </div>

        {/* Resultado e comentário */}
        <AnimatePresence>
          {showResult && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {/* Feedback visual */}
              <div className={cn(
                "p-4 rounded-lg flex items-center gap-3",
                isCorrect ? "bg-emerald-500/10 border border-emerald-500/30" : "bg-destructive/10 border border-destructive/30"
              )}>
                {isCorrect ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
                ) : (
                  <XCircle className="w-6 h-6 text-destructive shrink-0" />
                )}
                <p className={cn(
                  "font-medium",
                  isCorrect ? "text-emerald-700 dark:text-emerald-400" : "text-destructive"
                )}>
                  {isCorrect ? "Resposta correta!" : `Resposta incorreta. A correta é: ${currentQuestion.resposta_correta}`}
                </p>
              </div>

              {/* Comentário com botão de áudio */}
              {currentQuestion.comentario && (
                <div className="p-4 rounded-lg bg-muted/50 border space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-sm text-muted-foreground">Comentário:</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={tocarAudioComentario}
                      disabled={comentarioAudioLoading}
                      className="h-8 px-2 gap-1"
                    >
                      {comentarioAudioLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <MessageSquare className="w-4 h-4" />
                      )}
                      <span className="text-xs">Ouvir</span>
                    </Button>
                  </div>
                  <p className="text-sm leading-relaxed">{currentQuestion.comentario}</p>
                </div>
              )}

              {/* Botão de Exemplo Prático */}
              {currentQuestion.exemplo_pratico && (
                <Button
                  variant="outline"
                  onClick={() => setShowExemplo(true)}
                  className="w-full"
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Ver Exemplo Prático
                </Button>
              )}

              {/* Botão de próxima questão */}
              <Button onClick={handleNext} className="w-full" size="lg">
                {currentIndex < questoesState.length - 1 ? (
                  <>
                    Próxima Questão
                    <ChevronRight className="w-5 h-5 ml-2" />
                  </>
                ) : (
                  <>
                    Finalizar Quiz
                    <Trophy className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Drawer do Exemplo Prático */}
      <Drawer open={showExemplo} onOpenChange={setShowExemplo}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader>
            <DrawerTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Exemplo Prático
            </DrawerTitle>
            <DrawerDescription>
              Aplicação prática do conceito abordado na questão
            </DrawerDescription>
          </DrawerHeader>
          
          <div className="px-4 pb-4 overflow-y-auto space-y-4">
            {/* Botão de áudio do exemplo */}
            <Button
              variant="secondary"
              size="sm"
              onClick={tocarAudioExemplo}
              disabled={exemploAudioLoading}
              className="w-full gap-2"
            >
              {exemploAudioLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
              Ouvir Exemplo
            </Button>
            
            {/* Imagem do exemplo */}
            {(imagemLoading || currentQuestion?.url_imagem_exemplo) && (
              <div className="rounded-lg overflow-hidden bg-muted/30 border">
                {imagemLoading ? (
                  <div className="aspect-square flex items-center justify-center">
                    <div className="text-center space-y-2">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Gerando ilustração...</p>
                    </div>
                  </div>
                ) : currentQuestion?.url_imagem_exemplo && (
                  <img 
                    src={currentQuestion.url_imagem_exemplo} 
                    alt="Ilustração do exemplo prático"
                    className="w-full h-auto"
                  />
                )}
              </div>
            )}
            
            {/* Texto do exemplo */}
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {currentQuestion?.exemplo_pratico}
            </p>
          </div>

          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="outline">Fechar</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Elemento de áudio oculto */}
      <audio
        ref={audioRef}
        onEnded={() => setIsPlaying(false)}
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
      />
    </motion.div>
  );
};

export default QuestoesConcurso;
