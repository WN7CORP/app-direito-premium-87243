import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, XCircle, ChevronRight, Trophy, RotateCcw, BookOpen, Volume2, Pause, Loader2, PlayCircle, StopCircle } from "lucide-react";
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
  url_audio_comentario?: string;
  url_audio_exemplo?: string;
  url_imagem_exemplo?: string;
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
  
  // Estados de áudio do enunciado
  const [audioLoading, setAudioLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Estados de áudio do comentário
  const [audioComentarioLoading, setAudioComentarioLoading] = useState(false);
  const [isPlayingComentario, setIsPlayingComentario] = useState(false);
  
  // Estados de áudio do exemplo
  const [audioExemploLoading, setAudioExemploLoading] = useState(false);
  const [isPlayingExemplo, setIsPlayingExemplo] = useState(false);
  
  // Estados gerais
  const [shakeError, setShakeError] = useState(false);
  const [narrationLoading, setNarrationLoading] = useState(false);
  const [imagemLoading, setImagemLoading] = useState(false);
  
  // Estados do modo automático
  const [modoAutomatico, setModoAutomatico] = useState(false);
  const [etapaAtual, setEtapaAtual] = useState<'enunciado' | 'comentario' | 'exemplo' | 'aguardando' | null>(null);
  const autoModeRef = useRef<boolean>(false);
  const pausadoPorInteracaoRef = useRef<boolean>(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioComentarioRef = useRef<HTMLAudioElement>(null);
  const audioExemploRef = useRef<HTMLAudioElement>(null);
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

  // Função para narrar texto dinamicamente (usado apenas para feedback automático)
  const narrarTexto = useCallback(async (texto: string): Promise<void> => {
    return new Promise(async (resolve) => {
      try {
        if (narrationAudioRef.current) {
          narrationAudioRef.current.pause();
          narrationAudioRef.current = null;
        }

        setNarrationLoading(true);
        
        const { data, error } = await supabase.functions.invoke('gerar-narracao', {
          body: { texto }
        });

        if (error || !data?.audioBase64) {
          console.error('Erro ao gerar narração:', error);
          setNarrationLoading(false);
          resolve();
          return;
        }

        const audioUrl = `data:audio/mpeg;base64,${data.audioBase64}`;
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

  // Gerar áudio do enunciado e reproduzir automaticamente (apenas se NÃO estiver em modo automático)
  useEffect(() => {
    const questaoAtual = questoesState[currentIndex];
    if (!questaoAtual || modoAutomatico) return;

    stopAllAudio();

    const iniciarAudioEnunciado = async () => {
      let url = questaoAtual.url_audio;
      
      if (!url) {
        url = await gerarAudioGenerico(questaoAtual.id, questaoAtual.enunciado, 'enunciado');
      }
      
      if (url && audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.play().then(() => {
          setIsPlaying(true);
        }).catch((err) => {
          console.log('Autoplay bloqueado pelo navegador:', err);
        });
      }
    };

    iniciarAudioEnunciado();
  }, [currentIndex, modoAutomatico]);

  // Função para parar todos os áudios
  const stopAllAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
    if (audioComentarioRef.current) {
      audioComentarioRef.current.pause();
      setIsPlayingComentario(false);
    }
    if (audioExemploRef.current) {
      audioExemploRef.current.pause();
      setIsPlayingExemplo(false);
    }
    if (narrationAudioRef.current) {
      narrationAudioRef.current.pause();
      narrationAudioRef.current = null;
    }
  }, []);

  // Gerar imagem do exemplo prático
  const gerarImagemExemplo = useCallback(async (questao: Questao) => {
    if (!questao.exemplo_pratico || questao.url_imagem_exemplo || imagemLoading) return;
    
    setImagemLoading(true);
    console.log(`Gerando imagem para exemplo da questão ${questao.id}...`);

    try {
      const { data, error } = await supabase.functions.invoke('gerar-imagem-exemplo', {
        body: { 
          questaoId: questao.id, 
          exemploTexto: questao.exemplo_pratico,
          area: area,
          tema: tema
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
  }, [imagemLoading, area, tema]);

  // Gerar imagem do exemplo automaticamente ao entrar na questão
  useEffect(() => {
    const questaoAtual = questoesState[currentIndex];
    if (!questaoAtual?.exemplo_pratico || questaoAtual.url_imagem_exemplo) return;
    
    // Gerar imagem em background (não bloqueia a interface)
    gerarImagemExemplo(questaoAtual);
  }, [currentIndex, questoesState, gerarImagemExemplo]);

  // Gerar áudio genérico (enunciado, comentário ou exemplo)
  const gerarAudioGenerico = useCallback(async (questaoId: number, texto: string, tipo: 'enunciado' | 'comentario' | 'exemplo') => {
    const setLoading = tipo === 'enunciado' ? setAudioLoading 
      : tipo === 'comentario' ? setAudioComentarioLoading 
      : setAudioExemploLoading;

    setLoading(true);
    console.log(`Gerando áudio ${tipo} para questão ${questaoId}...`);

    // Adicionar prefixo "Exemplo prático" quando for narrar o exemplo
    const textoParaNarrar = tipo === 'exemplo' ? `Exemplo prático. ${texto}` : texto;

    try {
      const { data, error } = await supabase.functions.invoke('gerar-audio-generico', {
        body: { questaoId, texto: textoParaNarrar, tipo }
      });

      if (error) {
        console.error(`Erro ao gerar áudio ${tipo}:`, error);
        setLoading(false);
        return null;
      }

      if (data?.url_audio) {
        const coluna = tipo === 'enunciado' ? 'url_audio' 
          : tipo === 'comentario' ? 'url_audio_comentario' 
          : 'url_audio_exemplo';
        
        setQuestoesState(prev => prev.map(q => 
          q.id === questaoId ? { ...q, [coluna]: data.url_audio } : q
        ));
        console.log(`Áudio ${tipo} gerado: ${data.url_audio}, cached: ${data.cached}`);
        return data.url_audio;
      }
    } catch (err) {
      console.error(`Erro ao chamar função de áudio ${tipo}:`, err);
    } finally {
      setLoading(false);
    }
    return null;
  }, []);

  // Função para narrar comentário automaticamente
  const narrarComentarioAutomatico = useCallback(async () => {
    if (!currentQuestion?.comentario || !audioComentarioRef.current) return;
    
    let url = currentQuestion.url_audio_comentario;
    
    // Se não tem URL, gerar
    if (!url) {
      url = await gerarAudioGenerico(currentQuestion.id, currentQuestion.comentario, 'comentario');
    }
    
    // Reproduzir automaticamente
    if (url && audioComentarioRef.current) {
      audioComentarioRef.current.src = url;
      audioComentarioRef.current.play().then(() => {
        setIsPlayingComentario(true);
      }).catch((err) => {
        console.log('Autoplay comentário bloqueado:', err);
      });
    }
  }, [currentQuestion, gerarAudioGenerico]);

  // Gerar imagem e áudio quando drawer abrir + pausar modo automático
  useEffect(() => {
    if (showExemplo && currentQuestion?.exemplo_pratico) {
      // Pausar modo automático se estiver ativo
      if (modoAutomatico) {
        autoModeRef.current = false;
        pausadoPorInteracaoRef.current = true;
      }
      
      stopAllAudio();
      
      if (!currentQuestion.url_imagem_exemplo) {
        gerarImagemExemplo(currentQuestion);
      }
      
      // Gerar e reproduzir áudio do exemplo automaticamente
      const autoNarrarExemplo = async () => {
        let url = currentQuestion.url_audio_exemplo;
        
        if (!url) {
          url = await gerarAudioGenerico(currentQuestion.id, currentQuestion.exemplo_pratico!, 'exemplo');
        }
        
        // Reproduzir automaticamente
        if (url && audioExemploRef.current) {
          audioExemploRef.current.src = url;
          audioExemploRef.current.play().then(() => {
            setIsPlayingExemplo(true);
          }).catch((err) => {
            console.log('Autoplay exemplo bloqueado:', err);
          });
        }
      };
      
      autoNarrarExemplo();
    }
  }, [showExemplo, currentQuestion?.id]);

  // Retomar modo automático quando fechar drawer
  useEffect(() => {
    if (!showExemplo && pausadoPorInteracaoRef.current && modoAutomatico) {
      // Retomar após fechar o drawer
      pausadoPorInteracaoRef.current = false;
      autoModeRef.current = true;
      // O modo automático vai continuar de onde parou
    }
  }, [showExemplo, modoAutomatico]);

  // ============ MODO AUTOMÁTICO ============

  // Aguardar tempo em ms
  const aguardarMs = (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms));
  };

  // Reproduz áudio e retorna Promise quando terminar
  const reproduzirAudioEAguardar = useCallback((url: string, audioElement: HTMLAudioElement | null): Promise<void> => {
    return new Promise((resolve) => {
      if (!audioElement || !url) return resolve();
      
      const onEnded = () => {
        audioElement.removeEventListener('ended', onEnded);
        audioElement.removeEventListener('error', onError);
        resolve();
      };
      
      const onError = () => {
        audioElement.removeEventListener('ended', onEnded);
        audioElement.removeEventListener('error', onError);
        resolve();
      };
      
      audioElement.addEventListener('ended', onEnded);
      audioElement.addEventListener('error', onError);
      
      audioElement.src = url;
      audioElement.play().catch(() => {
        audioElement.removeEventListener('ended', onEnded);
        audioElement.removeEventListener('error', onError);
        resolve();
      });
    });
  }, []);

  // Função para obter ou gerar áudio
  const obterOuGerarAudio = useCallback(async (questao: Questao, tipo: 'enunciado' | 'comentario' | 'exemplo'): Promise<string | null> => {
    if (tipo === 'enunciado') {
      if (questao.url_audio) return questao.url_audio;
      return await gerarAudioGenerico(questao.id, questao.enunciado, 'enunciado');
    }
    if (tipo === 'comentario') {
      if (questao.url_audio_comentario) return questao.url_audio_comentario;
      return await gerarAudioGenerico(questao.id, questao.comentario, 'comentario');
    }
    if (tipo === 'exemplo' && questao.exemplo_pratico) {
      if (questao.url_audio_exemplo) return questao.url_audio_exemplo;
      return await gerarAudioGenerico(questao.id, questao.exemplo_pratico, 'exemplo');
    }
    return null;
  }, [gerarAudioGenerico]);

  // Pré-carregar áudios das próximas questões
  const preCarregarProximos = useCallback(async (indiceAtual: number) => {
    for (let i = indiceAtual + 1; i <= Math.min(indiceAtual + 2, questoesState.length - 1); i++) {
      if (!autoModeRef.current) break;
      const q = questoesState[i];
      if (!q.url_audio) {
        await gerarAudioGenerico(q.id, q.enunciado, 'enunciado');
      }
      if (!q.url_audio_comentario && q.comentario) {
        await gerarAudioGenerico(q.id, q.comentario, 'comentario');
      }
      if (q.exemplo_pratico && !q.url_audio_exemplo) {
        await gerarAudioGenerico(q.id, q.exemplo_pratico, 'exemplo');
      }
    }
  }, [questoesState, gerarAudioGenerico]);

  // Função principal de narração automática
  const iniciarModoAutomatico = useCallback(async () => {
    setModoAutomatico(true);
    autoModeRef.current = true;
    pausadoPorInteracaoRef.current = false;
    
    stopAllAudio();
    
    // Iniciar pré-carregamento em background
    preCarregarProximos(currentIndex);
    
    for (let i = currentIndex; i < questoesState.length && autoModeRef.current; i++) {
      // Atualizar índice
      if (i !== currentIndex) {
        setCurrentIndex(i);
        setSelectedAnswer(null);
        setShowResult(false);
        setShowExemplo(false);
        await aguardarMs(300);
      }
      
      const questao = questoesState[i];
      
      // ETAPA 1: Narrar enunciado
      if (!autoModeRef.current) break;
      setEtapaAtual('enunciado');
      const urlEnunciado = await obterOuGerarAudio(questao, 'enunciado');
      if (urlEnunciado && autoModeRef.current) {
        setIsPlaying(true);
        await reproduzirAudioEAguardar(urlEnunciado, audioRef.current);
        setIsPlaying(false);
      }
      
      if (!autoModeRef.current) break;
      
      // ETAPA 2: Responder automaticamente (marca a correta)
      setEtapaAtual('aguardando');
      await aguardarMs(800);
      
      if (!autoModeRef.current) break;
      
      // Marcar resposta correta
      setSelectedAnswer(questao.resposta_correta);
      setShowResult(true);
      setScore(prev => ({ ...prev, correct: prev.correct + 1 }));
      
      // Atualiza estatísticas no banco
      try {
        await supabase.rpc("incrementar_stats_questao", {
          p_questao_id: questao.id,
          p_correta: true
        });
      } catch (error) {
        console.error("Erro ao atualizar stats:", error);
      }
      
      await aguardarMs(500);
      
      if (!autoModeRef.current) break;
      
      // ETAPA 3: Narrar comentário
      setEtapaAtual('comentario');
      const urlComentario = await obterOuGerarAudio(questao, 'comentario');
      if (urlComentario && autoModeRef.current) {
        setIsPlayingComentario(true);
        await reproduzirAudioEAguardar(urlComentario, audioComentarioRef.current);
        setIsPlayingComentario(false);
      }
      
      if (!autoModeRef.current) break;
      
      // ETAPA 4: Narrar exemplo (se existir)
      if (questao.exemplo_pratico) {
        setEtapaAtual('exemplo');
        const urlExemplo = await obterOuGerarAudio(questao, 'exemplo');
        if (urlExemplo && autoModeRef.current) {
          setIsPlayingExemplo(true);
          await reproduzirAudioEAguardar(urlExemplo, audioExemploRef.current);
          setIsPlayingExemplo(false);
        }
      }
      
      if (!autoModeRef.current) break;
      
      // Pequena pausa antes da próxima
      await aguardarMs(1000);
      
      // Pré-carregar próximas questões
      if (autoModeRef.current) {
        preCarregarProximos(i);
      }
    }
    
    // Finalizar modo automático
    setModoAutomatico(false);
    autoModeRef.current = false;
    setEtapaAtual(null);
    
    // Se terminou todas as questões
    if (currentIndex >= questoesState.length - 1 || !autoModeRef.current) {
      setFinished(true);
    }
  }, [currentIndex, questoesState, stopAllAudio, obterOuGerarAudio, reproduzirAudioEAguardar, preCarregarProximos]);

  // Parar modo automático
  const pararModoAutomatico = useCallback(() => {
    autoModeRef.current = false;
    setModoAutomatico(false);
    setEtapaAtual(null);
    stopAllAudio();
  }, [stopAllAudio]);

  // ============ FIM MODO AUTOMÁTICO ============

  // Play/toggle áudio do enunciado
  const toggleAudioEnunciado = async () => {
    if (!audioRef.current) return;

    if (audioComentarioRef.current) {
      audioComentarioRef.current.pause();
      setIsPlayingComentario(false);
    }
    if (audioExemploRef.current) {
      audioExemploRef.current.pause();
      setIsPlayingExemplo(false);
    }
    if (narrationAudioRef.current) {
      narrationAudioRef.current.pause();
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      let url = currentQuestion?.url_audio;
      
      if (!url && !audioLoading) {
        url = await gerarAudioGenerico(currentQuestion.id, currentQuestion.enunciado, 'enunciado');
      }
      
      if (url) {
        if (audioRef.current.src !== url) {
          audioRef.current.src = url;
        }
        audioRef.current.play().then(() => {
          setIsPlaying(true);
        }).catch(console.error);
      }
    }
  };

  // Play/toggle áudio do comentário
  const toggleAudioComentario = async () => {
    if (!audioComentarioRef.current) return;

    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
    if (audioExemploRef.current) {
      audioExemploRef.current.pause();
      setIsPlayingExemplo(false);
    }
    if (narrationAudioRef.current) {
      narrationAudioRef.current.pause();
    }

    if (isPlayingComentario) {
      audioComentarioRef.current.pause();
      setIsPlayingComentario(false);
    } else {
      let url = currentQuestion?.url_audio_comentario;
      
      if (!url && !audioComentarioLoading && currentQuestion?.comentario) {
        url = await gerarAudioGenerico(currentQuestion.id, currentQuestion.comentario, 'comentario');
      }
      
      if (url) {
        if (audioComentarioRef.current.src !== url) {
          audioComentarioRef.current.src = url;
        }
        audioComentarioRef.current.play().then(() => {
          setIsPlayingComentario(true);
        }).catch(console.error);
      }
    }
  };

  // Play/toggle áudio do exemplo
  const toggleAudioExemplo = async () => {
    if (!audioExemploRef.current) return;

    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
    if (audioComentarioRef.current) {
      audioComentarioRef.current.pause();
      setIsPlayingComentario(false);
    }
    if (narrationAudioRef.current) {
      narrationAudioRef.current.pause();
    }

    if (isPlayingExemplo) {
      audioExemploRef.current.pause();
      setIsPlayingExemplo(false);
    } else {
      let url = currentQuestion?.url_audio_exemplo;
      
      if (!url && !audioExemploLoading && currentQuestion?.exemplo_pratico) {
        url = await gerarAudioGenerico(currentQuestion.id, currentQuestion.exemplo_pratico, 'exemplo');
      }
      
      if (url) {
        if (audioExemploRef.current.src !== url) {
          audioExemploRef.current.src = url;
        }
        audioExemploRef.current.play().then(() => {
          setIsPlayingExemplo(true);
        }).catch(console.error);
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
    
    // Se está em modo automático, parar
    if (modoAutomatico) {
      pararModoAutomatico();
    }
    
    stopAllAudio();
    
    setSelectedAnswer(answer);
    setShowResult(true);

    const correct = answer === currentQuestion.resposta_correta;
    setScore(prev => ({
      correct: prev.correct + (correct ? 1 : 0),
      wrong: prev.wrong + (correct ? 0 : 1)
    }));

    try {
      await supabase.rpc("incrementar_stats_questao", {
        p_questao_id: currentQuestion.id,
        p_correta: correct
      });
    } catch (error) {
      console.error("Erro ao atualizar stats:", error);
    }

    // Narrar feedback (correta/incorreta)
    if (correct) {
      await narrarTexto("Resposta correta!");
    } else {
      setShakeError(true);
      setTimeout(() => setShakeError(false), 600);
      await narrarTexto("Resposta incorreta.");
    }
    
    // Após narração do feedback, narrar comentário automaticamente
    await narrarComentarioAutomatico();
  };

  const handleNext = () => {
    stopAllAudio();
    setNarrationLoading(false);
    
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
    stopAllAudio();
    pararModoAutomatico();
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
            <div className="flex items-center gap-3">
              <span className="font-medium">
                {score.correct} ✓ / {score.wrong} ✗
              </span>
              
              {/* Botão Modo Automático */}
              {!modoAutomatico ? (
                <Button 
                  onClick={iniciarModoAutomatico} 
                  variant="outline" 
                  size="sm"
                  className="h-8 gap-1.5"
                >
                  <PlayCircle className="w-4 h-4" />
                  <span className="hidden sm:inline">Auto</span>
                </Button>
              ) : (
                <Button 
                  onClick={pararModoAutomatico} 
                  variant="destructive" 
                  size="sm"
                  className="h-8 gap-1.5"
                >
                  <StopCircle className="w-4 h-4" />
                  <span className="hidden sm:inline">Parar</span>
                </Button>
              )}
            </div>
          </div>
          <Progress value={progress} className="h-2" />
          
          {/* Indicador de etapa no modo automático */}
          {modoAutomatico && etapaAtual && (
            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
              <Loader2 className="w-3 h-3 animate-spin" />
              {etapaAtual === 'enunciado' && 'Narrando enunciado...'}
              {etapaAtual === 'comentario' && 'Narrando comentário...'}
              {etapaAtual === 'exemplo' && 'Narrando exemplo...'}
              {etapaAtual === 'aguardando' && 'Processando...'}
            </div>
          )}
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
                  
                  {/* Botão de áudio do enunciado */}
                  <button 
                    onClick={toggleAudioEnunciado}
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
                      disabled={showResult || modoAutomatico}
                      className={cn(
                        "w-full flex items-start gap-3 p-4 rounded-xl border transition-all text-left",
                        bgClass,
                        borderClass,
                        !showResult && !modoAutomatico && "active:scale-[0.98]"
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
                    
                    <div className="flex items-center gap-2">
                      {/* Botão Narrar Comentário */}
                      <button
                        onClick={toggleAudioComentario}
                        disabled={audioComentarioLoading}
                        className={cn(
                          "p-2 rounded-full transition-all",
                          audioComentarioLoading
                            ? "bg-muted cursor-wait"
                            : isPlayingComentario
                            ? "bg-primary text-primary-foreground"
                            : "bg-primary/10 hover:bg-primary/20 text-primary"
                        )}
                        title={audioComentarioLoading ? "Gerando áudio..." : isPlayingComentario ? "Pausar" : "Ouvir comentário"}
                      >
                        {audioComentarioLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : isPlayingComentario ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Volume2 className="w-4 h-4" />
                        )}
                      </button>
                      
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
        {showResult && !modoAutomatico && (
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

      {/* Audio elements */}
      <audio 
        ref={audioRef} 
        onEnded={() => setIsPlaying(false)}
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
      />
      <audio 
        ref={audioComentarioRef} 
        onEnded={() => setIsPlayingComentario(false)}
        onPause={() => setIsPlayingComentario(false)}
        onPlay={() => setIsPlayingComentario(true)}
      />
      <audio 
        ref={audioExemploRef} 
        onEnded={() => setIsPlayingExemplo(false)}
        onPause={() => setIsPlayingExemplo(false)}
        onPlay={() => setIsPlayingExemplo(true)}
      />

      {/* Drawer de Exemplo Prático */}
      <Drawer open={showExemplo} onOpenChange={(open) => {
        setShowExemplo(open);
        if (!open && audioExemploRef.current) {
          audioExemploRef.current.pause();
          audioExemploRef.current.currentTime = 0;
          setIsPlayingExemplo(false);
        }
      }}>
        <DrawerContent>
          <DrawerHeader className="text-left">
            <DrawerTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                Exemplo Prático
              </div>
              
              {/* Botão Narrar Exemplo */}
              <button
                onClick={toggleAudioExemplo}
                disabled={audioExemploLoading}
                className={cn(
                  "p-2 rounded-full transition-all",
                  audioExemploLoading
                    ? "bg-muted cursor-wait"
                    : isPlayingExemplo
                    ? "bg-primary text-primary-foreground"
                    : "bg-primary/10 hover:bg-primary/20 text-primary"
                )}
                title={audioExemploLoading ? "Gerando áudio..." : isPlayingExemplo ? "Pausar" : "Ouvir exemplo"}
              >
                {audioExemploLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isPlayingExemplo ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
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
                  className="w-full aspect-video object-cover"
                />
              </div>
            ) : imagemLoading && (
              <div className="aspect-video rounded-xl bg-muted flex items-center justify-center">
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
