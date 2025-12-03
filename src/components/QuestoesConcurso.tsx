import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, XCircle, ChevronRight, Trophy, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

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

  const currentQuestion = questoes[currentIndex];
  const progress = ((currentIndex + 1) / questoes.length) * 100;
  const isCorrect = selectedAnswer === currentQuestion?.resposta_correta;

  const alternatives = [
    { key: "A", value: currentQuestion?.alternativa_a },
    { key: "B", value: currentQuestion?.alternativa_b },
    { key: "C", value: currentQuestion?.alternativa_c },
    { key: "D", value: currentQuestion?.alternativa_d },
  ];

  const handleSelectAnswer = async (answer: string) => {
    if (showResult) return;
    
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
  };

  const handleNext = () => {
    if (currentIndex < questoes.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
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
  };

  if (finished) {
    const percentage = Math.round((score.correct / questoes.length) * 100);
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
    <div className="flex-1 flex flex-col">
      {/* Progress */}
      <div className="px-4 py-3 border-b">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-muted-foreground">
            Questão {currentIndex + 1} de {questoes.length}
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

            {/* Enunciado */}
            <div className="bg-card rounded-xl p-4 border mb-4">
              <p className="text-sm leading-relaxed">{currentQuestion?.enunciado}</p>
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
                <div className="flex items-center gap-2 mb-2">
                  {isCorrect ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-amber-500" />
                  )}
                  <span className="font-semibold text-sm">
                    {isCorrect ? "Parabéns! Resposta correta!" : "Resposta incorreta"}
                  </span>
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
            {currentIndex < questoes.length - 1 ? (
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
    </div>
  );
};

export default QuestoesConcurso;
