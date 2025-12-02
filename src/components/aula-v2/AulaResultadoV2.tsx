import { useEffect } from "react";
import { motion } from "framer-motion";
import { Trophy, Star, RefreshCw, Home, Share2, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import confetti from "canvas-confetti";

interface AulaResultadoV2Props {
  titulo: string;
  acertos: number;
  total: number;
  onRefazer: () => void;
  onSair: () => void;
}

export const AulaResultadoV2 = ({
  titulo,
  acertos,
  total,
  onRefazer,
  onSair
}: AulaResultadoV2Props) => {
  const percentual = Math.round((acertos / total) * 100);
  const aprovado = percentual >= 60;

  useEffect(() => {
    if (aprovado) {
      const duration = 3000;
      const animationEnd = Date.now() + duration;

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) {
          clearInterval(interval);
          return;
        }

        confetti({
          particleCount: 3,
          angle: randomInRange(55, 125),
          spread: randomInRange(50, 70),
          origin: { x: randomInRange(0.1, 0.9), y: Math.random() - 0.2 }
        });
      }, 100);

      return () => clearInterval(interval);
    }
  }, [aprovado]);

  const getMessage = () => {
    if (percentual === 100) return "Perfeito! Você dominou o conteúdo!";
    if (percentual >= 80) return "Excelente! Você está muito bem preparado!";
    if (percentual >= 60) return "Bom trabalho! Continue estudando!";
    if (percentual >= 40) return "Quase lá! Revise o conteúdo e tente novamente.";
    return "Continue estudando! A prática leva à perfeição.";
  };

  const getGradient = () => {
    if (percentual >= 80) return "from-emerald-500 to-green-500";
    if (percentual >= 60) return "from-amber-500 to-orange-500";
    return "from-red-500 to-rose-500";
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-2xl">
          {/* Header with gradient */}
          <div className={`bg-gradient-to-br ${getGradient()} p-8 text-center relative overflow-hidden`}>
            {/* Decorative circles */}
            <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-24 h-24 bg-white/10 rounded-full translate-x-1/2 translate-y-1/2" />
            
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="relative z-10"
            >
              <div className="w-24 h-24 mx-auto bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mb-4">
                {aprovado ? (
                  <Trophy className="w-12 h-12 text-white" />
                ) : (
                  <RefreshCw className="w-12 h-12 text-white" />
                )}
              </div>
              
              <h2 className="text-3xl font-bold text-white mb-1">
                {percentual}%
              </h2>
              <p className="text-white/80">de aproveitamento</p>
            </motion.div>
          </div>

          {/* Content */}
          <div className="p-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-center mb-6"
            >
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {getMessage()}
              </h3>
              <p className="text-sm text-muted-foreground">{titulo}</p>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="grid grid-cols-2 gap-4 mb-6"
            >
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-center">
                <CheckCircle className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-emerald-400">{acertos}</p>
                <p className="text-xs text-muted-foreground">Acertos</p>
              </div>
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
                <XCircle className="w-6 h-6 text-red-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-red-400">{total - acertos}</p>
                <p className="text-xs text-muted-foreground">Erros</p>
              </div>
            </motion.div>

            {/* Stars */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex justify-center gap-2 mb-6"
            >
              {[1, 2, 3, 4, 5].map((star) => (
                <motion.div
                  key={star}
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.5 + star * 0.1, type: "spring" }}
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= Math.ceil(percentual / 20) 
                        ? 'text-amber-400 fill-amber-400' 
                        : 'text-border'
                    }`}
                  />
                </motion.div>
              ))}
            </motion.div>

            {/* Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="space-y-3"
            >
              <Button
                onClick={onRefazer}
                variant="outline"
                className="w-full h-12 rounded-xl"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refazer Aula
              </Button>
              
              <Button
                onClick={onSair}
                className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl"
              >
                <Home className="w-4 h-4 mr-2" />
                Voltar ao Código
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
