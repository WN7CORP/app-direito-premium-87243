import { motion } from "framer-motion";
import { LayoutList, CheckCircle, Star } from "lucide-react";

interface SlideResumoVisualProps {
  pontos?: string[];
  conteudo: string;
  titulo?: string;
}

export const SlideResumoVisual = ({ pontos, conteudo, titulo }: SlideResumoVisualProps) => {
  // Parse points from conteudo if pontos not provided
  const displayPoints = pontos || conteudo.split('\n').filter(p => p.trim());
  
  if (!displayPoints || displayPoints.length === 0) {
    return (
      <div className="text-muted-foreground text-center py-8">
        Resumo não disponível
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center gap-2 text-amber-400"
      >
        <Star className="w-5 h-5" />
        <span className="text-sm font-medium uppercase tracking-wide">Pontos Principais</span>
      </motion.div>
      
      {/* Points grid */}
      <div className="grid gap-3">
        {displayPoints.map((ponto, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + idx * 0.08 }}
            className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 hover:border-amber-500/40 transition-colors"
          >
            {/* Number badge */}
            <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
              <span className="text-xs font-bold text-white">{idx + 1}</span>
            </div>
            
            {/* Point content */}
            <div className="flex-1">
              <p className="text-foreground leading-relaxed">
                {ponto.replace(/^[-•*]\s*/, '').replace(/^\d+\.\s*/, '')}
              </p>
            </div>
            
            {/* Check icon */}
            <CheckCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-1" />
          </motion.div>
        ))}
      </div>
      
      {/* Summary indicator */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 + displayPoints.length * 0.08 }}
        className="flex items-center gap-2 pt-2 text-muted-foreground"
      >
        <LayoutList className="w-4 h-4 text-amber-400" />
        <span className="text-xs">Resumo visual dos conceitos mais importantes</span>
      </motion.div>
    </div>
  );
};
