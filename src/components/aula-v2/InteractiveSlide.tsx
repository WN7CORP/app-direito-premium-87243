import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FileText, 
  Lightbulb, 
  AlertTriangle, 
  Briefcase,
  CheckCircle2,
  XCircle,
  ChevronRight,
  ChevronLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SlideContent } from "./types";
import confetti from "canvas-confetti";

interface InteractiveSlideProps {
  slide: SlideContent;
  slideIndex: number;
  totalSlides: number;
  onNext: () => void;
  onPrevious: () => void;
  canGoBack: boolean;
}

const iconMap: Record<string, any> = {
  texto: FileText,
  explicacao: Lightbulb,
  atencao: AlertTriangle,
  exemplo: Briefcase,
  quickcheck: CheckCircle2
};

const colorMap: Record<string, string> = {
  texto: "from-blue-500 to-blue-600",
  explicacao: "from-amber-500 to-orange-500",
  atencao: "from-red-500 to-rose-500",
  exemplo: "from-emerald-500 to-green-500",
  quickcheck: "from-violet-500 to-purple-500"
};

const bgColorMap: Record<string, string> = {
  texto: "bg-blue-500/10 border-blue-500/20",
  explicacao: "bg-amber-500/10 border-amber-500/20",
  atencao: "bg-red-500/10 border-red-500/20",
  exemplo: "bg-emerald-500/10 border-emerald-500/20",
  quickcheck: "bg-violet-500/10 border-violet-500/20"
};

export const InteractiveSlide = ({
  slide,
  slideIndex,
  totalSlides,
  onNext,
  onPrevious,
  canGoBack
}: InteractiveSlideProps) => {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  
  const Icon = iconMap[slide.tipo] || FileText;
  const gradientColor = colorMap[slide.tipo] || colorMap.texto;
  const bgColor = bgColorMap[slide.tipo] || bgColorMap.texto;

  const handleOptionSelect = (index: number) => {
    if (showFeedback) return;
    
    setSelectedOption(index);
    setShowFeedback(true);
    
    if (index === slide.resposta) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 }
      });
    }
  };

  const handleContinue = () => {
    setSelectedOption(null);
    setShowFeedback(false);
    onNext();
  };

  const isQuickCheck = slide.tipo === 'quickcheck';
  const isCorrect = selectedOption === slide.resposta;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="min-h-[calc(100vh-8rem)] flex flex-col p-4 pb-24 md:pb-4 max-w-2xl mx-auto"
    >
      {/* Progress dots */}
      <div className="flex justify-center gap-1.5 mb-6">
        {Array.from({ length: totalSlides }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === slideIndex 
                ? 'w-6 bg-primary' 
                : i < slideIndex 
                  ? 'w-1.5 bg-primary/50' 
                  : 'w-1.5 bg-border'
            }`}
          />
        ))}
      </div>

      {/* Slide content */}
      <div className="flex-1 flex flex-col">
        {/* Header with icon */}
        <div className="flex items-center gap-3 mb-6">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradientColor} flex items-center justify-center shadow-lg`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              {slide.tipo === 'texto' && 'O texto diz'}
              {slide.tipo === 'explicacao' && 'Isso significa'}
              {slide.tipo === 'atencao' && 'Ponto de atenção'}
              {slide.tipo === 'exemplo' && 'Na prática'}
              {slide.tipo === 'quickcheck' && 'Verificação rápida'}
            </p>
            {slide.titulo && (
              <h2 className="text-lg font-semibold text-foreground">{slide.titulo}</h2>
            )}
          </div>
        </div>

        {/* Main content */}
        <div className={`rounded-2xl border p-5 md:p-6 ${bgColor} flex-1`}>
          {!isQuickCheck ? (
            <p className="text-foreground leading-relaxed whitespace-pre-line">
              {slide.conteudo}
            </p>
          ) : (
            <div className="space-y-4">
              <p className="text-foreground font-medium text-lg">
                {slide.pergunta}
              </p>
              
              <div className="space-y-3 mt-6">
                {slide.opcoes?.map((opcao, index) => {
                  const isSelected = selectedOption === index;
                  const isCorrectOption = index === slide.resposta;
                  
                  let optionStyle = "bg-card border-border hover:border-primary/50 hover:bg-primary/5";
                  
                  if (showFeedback) {
                    if (isCorrectOption) {
                      optionStyle = "bg-emerald-500/20 border-emerald-500 text-emerald-400";
                    } else if (isSelected && !isCorrectOption) {
                      optionStyle = "bg-red-500/20 border-red-500 text-red-400";
                    } else {
                      optionStyle = "bg-card/50 border-border/50 opacity-50";
                    }
                  }
                  
                  return (
                    <button
                      key={index}
                      onClick={() => handleOptionSelect(index)}
                      disabled={showFeedback}
                      className={`w-full p-4 rounded-xl border text-left transition-all ${optionStyle}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          showFeedback && isCorrectOption 
                            ? 'border-emerald-500 bg-emerald-500' 
                            : showFeedback && isSelected 
                              ? 'border-red-500 bg-red-500' 
                              : 'border-current'
                        }`}>
                          {showFeedback && isCorrectOption && (
                            <CheckCircle2 className="w-5 h-5 text-white" />
                          )}
                          {showFeedback && isSelected && !isCorrectOption && (
                            <XCircle className="w-5 h-5 text-white" />
                          )}
                          {!showFeedback && (
                            <span className="text-sm font-medium">
                              {String.fromCharCode(65 + index)}
                            </span>
                          )}
                        </div>
                        <span className="text-foreground">{opcao}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Feedback */}
              <AnimatePresence>
                {showFeedback && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`mt-6 p-4 rounded-xl ${
                      isCorrect 
                        ? 'bg-emerald-500/20 border border-emerald-500/30' 
                        : 'bg-red-500/20 border border-red-500/30'
                    }`}
                  >
                    <p className={`font-medium mb-1 ${isCorrect ? 'text-emerald-400' : 'text-red-400'}`}>
                      {isCorrect ? '✓ Correto!' : '✗ Incorreto'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {slide.feedback}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Navigation buttons - fixed on mobile */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t border-border md:relative md:bg-transparent md:border-0 md:p-0 md:mt-6 z-10">
        <div className="flex gap-3 max-w-2xl mx-auto">
          {canGoBack && (
            <Button
            variant="outline"
            onClick={onPrevious}
            className="flex-1 h-12 rounded-xl"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Voltar
          </Button>
        )}
        
        {(!isQuickCheck || showFeedback) && (
          <Button
            onClick={isQuickCheck ? handleContinue : onNext}
            className="flex-1 h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl"
          >
            Continuar
              <ChevronRight className="w-5 h-5 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
};
