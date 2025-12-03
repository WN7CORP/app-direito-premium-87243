import { motion } from "framer-motion";
import { BookOpen, User } from "lucide-react";

interface SlideStorytellingProps {
  personagem?: string;
  narrativa?: string;
  conteudo: string;
  titulo?: string;
}

export const SlideStorytelling = ({ personagem, narrativa, conteudo, titulo }: SlideStorytellingProps) => {
  const storyContent = narrativa || conteudo;
  
  // Split content into paragraphs for better reading
  const paragraphs = storyContent.split('\n').filter(p => p.trim());
  
  return (
    <div className="space-y-4">
      {/* Character badge */}
      {personagem && (
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/20 border border-purple-500/30"
        >
          <div className="w-8 h-8 rounded-full bg-purple-500/30 flex items-center justify-center">
            <User className="w-4 h-4 text-purple-400" />
          </div>
          <span className="text-sm font-medium text-purple-300">
            História de {personagem}
          </span>
        </motion.div>
      )}
      
      {/* Story content */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative"
      >
        {/* Decorative quote marks */}
        <div className="absolute -left-2 -top-2 text-5xl text-purple-500/20 font-serif">"</div>
        
        <div className="pl-6 space-y-4">
          {paragraphs.map((paragraph, idx) => (
            <motion.p 
              key={idx}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 + idx * 0.1 }}
              className="text-foreground leading-relaxed text-base md:text-lg"
            >
              {paragraph}
            </motion.p>
          ))}
        </div>
        
        <div className="absolute -right-2 bottom-0 text-5xl text-purple-500/20 font-serif rotate-180">"</div>
      </motion.div>
      
      {/* Story indicator */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex items-center gap-2 pt-4 text-muted-foreground"
      >
        <BookOpen className="w-4 h-4" />
        <span className="text-xs">Situação ilustrativa para compreensão do artigo</span>
      </motion.div>
    </div>
  );
};
