import React, { useState, useEffect } from "react";
import ReactCardFlip from "react-card-flip";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, RotateCw, Volume2, VolumeX } from "lucide-react";
import { useNarrationPlayer } from "@/contexts/NarrationPlayerContext";

interface Flashcard {
  front: string;
  back: string;
  exemplo?: string;
  "audio-pergunta"?: string;
  "audio-resposta"?: string;
}

interface FlashcardViewerProps {
  flashcards: Flashcard[];
  tema?: string;
}

export const FlashcardViewer = ({
  flashcards,
  tema
}: FlashcardViewerProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [autoPlayEnabled, setAutoPlayEnabled] = useState(true);
  const [direction, setDirection] = useState<'left' | 'right'>('right');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const { playNarration, stopNarration } = useNarrationPlayer();

  // Função para reproduzir áudio com fallback robusto
  const playAudio = async (url: string) => {
    console.log('🔊 playAudio chamado com URL:', url);
    
    if (!url) {
      console.warn('⚠️ URL de áudio vazia');
      return;
    }
    
    if (!autoPlayEnabled) {
      console.log('🔇 Auto-play desabilitado');
      return;
    }
    
    const audio = new Audio(url);
    console.log('🎼 Objeto Audio criado, tentando reproduzir...');
    setIsPlayingAudio(true);
    
    audio.onended = () => setIsPlayingAudio(false);
    audio.onerror = () => {
      console.error('❌ Erro no elemento de áudio');
      setIsPlayingAudio(false);
    };
    
    try {
      // Tentar usar o contexto primeiro
      await playNarration(audio);
      console.log('✅ Áudio reproduzido com sucesso via contexto');
    } catch (error) {
      console.warn('⚠️ Contexto falhou, usando reprodução direta:', error);
      // Fallback: tocar direto
      try {
        await audio.play();
        console.log('✅ Áudio reproduzido via fallback direto');
      } catch (playError) {
        console.error('❌ Falha total na reprodução:', playError);
        console.error('URL problemática:', url);
        setIsPlayingAudio(false);
      }
    }
  };

  // Reproduz áudio ao mudar de card
  useEffect(() => {
    const currentCard = flashcards[currentIndex];
    if (!currentCard) return;

    console.log('🎵 [Flashcard Audio Debug]', {
      currentIndex,
      isFlipped,
      autoPlayEnabled,
      'audio-pergunta': currentCard["audio-pergunta"],
      'audio-resposta': currentCard["audio-resposta"],
      cardFront: currentCard.front?.substring(0, 50)
    });

    if (!isFlipped && currentCard["audio-pergunta"]) {
      console.log('▶️ Tentando tocar áudio da PERGUNTA:', currentCard["audio-pergunta"]);
      playAudio(currentCard["audio-pergunta"]);
    }

    return () => stopNarration();
  }, [currentIndex, isFlipped, autoPlayEnabled]);


  const handleNext = () => {
    setIsFlipped(false);
    setDirection('right');
    setCurrentIndex(prev => (prev + 1) % flashcards.length);
  };

  const handlePrevious = () => {
    setIsFlipped(false);
    setDirection('left');
    setCurrentIndex(prev => (prev - 1 + flashcards.length) % flashcards.length);
  };

  const handleFlip = () => {
    const currentCard = flashcards[currentIndex];
    const newFlipState = !isFlipped;
    
    console.log('🔄 Virando card:', {
      newFlipState,
      'audio-resposta': currentCard["audio-resposta"],
      'audio-pergunta': currentCard["audio-pergunta"]
    });
    
    setIsFlipped(newFlipState);
    
    // Toca o áudio correspondente ao virar o card
    if (newFlipState && currentCard["audio-resposta"]) {
      console.log('▶️ Tentando tocar áudio da RESPOSTA:', currentCard["audio-resposta"]);
      playAudio(currentCard["audio-resposta"]);
    } else if (!newFlipState && currentCard["audio-pergunta"]) {
      console.log('▶️ Tentando tocar áudio da PERGUNTA:', currentCard["audio-pergunta"]);
      playAudio(currentCard["audio-pergunta"]);
    }
  };

  if (flashcards.length === 0) return null;
  const currentCard = flashcards[currentIndex];
  
  // Verifica se o card atual tem áudio
  const hasAudio = currentCard["audio-pergunta"] || currentCard["audio-resposta"];

  const slideVariants = {
    enter: (direction: 'left' | 'right') => ({
      x: direction === 'right' ? 100 : -100,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction: 'left' | 'right') => ({
      x: direction === 'right' ? -100 : 100,
      opacity: 0
    })
  };

  return <div className="w-full max-w-full mx-auto px-2 sm:px-4 py-4 space-y-4 overflow-hidden">
      <div className="flex justify-between items-center mb-2">
        <div className="text-center text-sm text-muted-foreground flex-1">
          Flashcard {currentIndex + 1} de {flashcards.length}
        </div>
        {hasAudio && (
          <Button
            onClick={() => setAutoPlayEnabled(!autoPlayEnabled)}
            variant="ghost"
            size="sm"
            className="gap-2"
            title={autoPlayEnabled ? "Desativar narração automática" : "Ativar narração automática"}
          >
            {autoPlayEnabled ? (
              <>
                <Volume2 className="w-4 h-4" />
                <span className="text-xs hidden sm:inline">Auto</span>
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4" />
                <span className="text-xs hidden sm:inline">Manual</span>
              </>
            )}
          </Button>
        )}
      </div>

      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={currentIndex}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          <ReactCardFlip isFlipped={isFlipped} flipDirection="horizontal">
            <div 
              onClick={handleFlip} 
              className="h-[300px] bg-card border-2 border-[hsl(270,60%,55%)] rounded-xl p-4 sm:p-8 flex flex-col cursor-pointer hover:shadow-lg transition-shadow relative break-words"
              style={{ backfaceVisibility: 'hidden' }}
            >
              {tema && (
                <p className="text-xs text-[hsl(270,70%,75%)] mb-3 absolute top-4 left-4">
                  {tema}
                </p>
              )}
              <div className="flex-1 flex items-center justify-center text-center">
                <div className="w-full space-y-3">
                  <p className="text-lg font-semibold mb-2">{currentCard.front}</p>
                  {currentCard["audio-pergunta"] && (
                    <div className="flex items-center justify-center gap-2 text-xs text-[hsl(270,60%,55%)]">
                      <Volume2 className="w-3 h-3" />
                      <span>{isPlayingAudio && !isFlipped ? 'Reproduzindo...' : 'Narração disponível'}</span>
                    </div>
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-4 text-center">Clique para ver a resposta</p>
            </div>

            <div 
              onClick={handleFlip} 
              className="min-h-[300px] bg-card border-2 border-[hsl(270,60%,55%)] rounded-xl p-4 sm:p-8 pt-10 cursor-pointer hover:shadow-lg transition-shadow relative break-words flex flex-col"
              style={{ backfaceVisibility: 'hidden' }}
            >
              {tema && (
                <p className="text-xs text-[hsl(270,70%,75%)] absolute top-3 left-4">
                  {tema}
                </p>
              )}
              <div className="flex-1 flex flex-col items-center justify-center">
                <div className="text-center space-y-3">
                  <p className="font-semibold text-foreground leading-relaxed text-base">
                    {currentCard.back}
                  </p>
                  {currentCard["audio-resposta"] && (
                    <div className="flex items-center justify-center gap-2 text-xs text-[hsl(270,60%,55%)]">
                      <Volume2 className="w-3 h-3" />
                      <span>{isPlayingAudio && isFlipped ? 'Reproduzindo...' : 'Narração disponível'}</span>
                    </div>
                  )}
                </div>
                
                {currentCard.exemplo && (
                  <div className="bg-background/50 rounded-lg p-4 border border-[hsl(270,60%,55%)]/20 mt-4">
                    <p className="text-xs font-semibold mb-2 text-[hsl(270,60%,55%)] flex items-center gap-2">
                      <span>💡</span> Exemplo Prático:
                    </p>
                    <p className="text-sm text-foreground leading-relaxed">
                      {currentCard.exemplo}
                    </p>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground text-center mt-4">
                Clique para voltar
              </p>
            </div>
          </ReactCardFlip>
        </motion.div>
      </AnimatePresence>

      <div className="space-y-3">
        {hasAudio && (
          <div className="flex gap-2 justify-center">
            {currentCard["audio-pergunta"] && !isFlipped && (
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  playAudio(currentCard["audio-pergunta"]!);
                }}
                variant="outline"
                size="sm"
                className="gap-2"
                disabled={isPlayingAudio}
              >
                <Volume2 className="w-4 h-4" />
                Ouvir Pergunta
              </Button>
            )}
            {currentCard["audio-resposta"] && isFlipped && (
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  playAudio(currentCard["audio-resposta"]!);
                }}
                variant="outline"
                size="sm"
                className="gap-2"
                disabled={isPlayingAudio}
              >
                <Volume2 className="w-4 h-4" />
                Ouvir Resposta
              </Button>
            )}
          </div>
        )}
        
        <div className="flex justify-between items-center gap-4">
          <Button onClick={handlePrevious} variant="outline" disabled={flashcards.length <= 1} className="flex-1">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Anterior
          </Button>

          <Button onClick={handleFlip} variant="ghost" size="icon">
            <RotateCw className="w-4 h-4" />
          </Button>

          <Button onClick={handleNext} variant="outline" disabled={flashcards.length <= 1} className="flex-1">
            Próximo
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>;
};