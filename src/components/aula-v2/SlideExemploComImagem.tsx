import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Briefcase, Image as ImageIcon, Loader2, Building2, Home, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface SlideExemploComImagemProps {
  conteudo: string;
  contexto?: string;
  titulo?: string;
  imagemUrl?: string;
  onImageGenerated?: (url: string) => void;
  numeroArtigo?: string;
  codigoTabela?: string;
  secaoId?: number;
  slideIndex?: number;
}

export const SlideExemploComImagem = ({ 
  conteudo, 
  contexto, 
  titulo,
  imagemUrl: propImagemUrl,
  onImageGenerated,
  numeroArtigo,
  codigoTabela,
  secaoId,
  slideIndex
}: SlideExemploComImagemProps) => {
  const [imagemUrl, setImagemUrl] = useState<string | null>(propImagemUrl || null);
  const [loadingImagem, setLoadingImagem] = useState(false);
  const [imagemError, setImagemError] = useState(false);

  // Get appropriate icon based on context
  const getContextIcon = () => {
    const ctx = contexto?.toLowerCase() || '';
    if (ctx.includes('profissional') || ctx.includes('trabalho') || ctx.includes('empresa')) {
      return Building2;
    }
    if (ctx.includes('cotidiano') || ctx.includes('dia-a-dia') || ctx.includes('casa')) {
      return Home;
    }
    if (ctx.includes('família') || ctx.includes('social')) {
      return Users;
    }
    return Briefcase;
  };

  const ContextIcon = getContextIcon();

  // Generate image when component mounts if no image exists
  useEffect(() => {
    if (propImagemUrl) {
      setImagemUrl(propImagemUrl);
      return;
    }

    if (!imagemUrl && !loadingImagem && numeroArtigo && codigoTabela && conteudo) {
      gerarImagem();
    }
  }, [propImagemUrl, numeroArtigo, codigoTabela]);

  const gerarImagem = async () => {
    if (loadingImagem || imagemUrl) return;
    
    setLoadingImagem(true);
    setImagemError(false);

    try {
      const response = await supabase.functions.invoke('gerar-imagem-aula-artigo', {
        body: {
          conteudo,
          tipo: 'exemplo',
          contexto,
          numeroArtigo,
          codigoTabela,
          secaoId,
          slideIndex
        }
      });

      if (response.error) {
        console.error('Erro ao gerar imagem exemplo:', response.error);
        setImagemError(true);
      } else if (response.data?.url_imagem) {
        setImagemUrl(response.data.url_imagem);
        onImageGenerated?.(response.data.url_imagem);
      }
    } catch (error) {
      console.error('Erro ao gerar imagem exemplo:', error);
      setImagemError(true);
    } finally {
      setLoadingImagem(false);
    }
  };

  // Helper to render HTML content safely
  const renderHtmlContent = (content: string) => {
    // Check if content contains HTML tags
    if (/<[^>]+>/.test(content)) {
      return (
        <div 
          className="text-foreground leading-relaxed whitespace-pre-line [&_span]:rounded [&_span]:px-1"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      );
    }
    
    // Split into paragraphs
    const paragraphs = content.split('\n').filter(p => p.trim());
    
    return (
      <div className="space-y-3">
        {paragraphs.map((paragraph, idx) => (
          <motion.p 
            key={idx}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 + idx * 0.05 }}
            className="text-foreground leading-relaxed"
          >
            {paragraph}
          </motion.p>
        ))}
      </div>
    );
  };
  
  return (
    <div className="space-y-4">
      {/* Context badge */}
      {contexto && (
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30"
        >
          <ContextIcon className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-xs font-medium text-emerald-400">{contexto}</span>
        </motion.div>
      )}

      {/* Illustration Image */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="relative rounded-xl overflow-hidden bg-card/50 border border-border/50"
      >
        {loadingImagem ? (
          <div className="aspect-video flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-emerald-500/10 to-green-500/10">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
            <span className="text-sm text-muted-foreground">Gerando ilustração do exemplo...</span>
          </div>
        ) : imagemUrl ? (
          <img 
            src={imagemUrl} 
            alt={`Ilustração: ${titulo || contexto || 'Exemplo prático'}`}
            className="w-full aspect-video object-cover"
            onError={() => setImagemError(true)}
          />
        ) : imagemError ? (
          <div className="aspect-video flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-emerald-500/10 to-green-500/10">
            <ImageIcon className="w-8 h-8 text-muted-foreground/50" />
            <span className="text-sm text-muted-foreground">Ilustração indisponível</span>
          </div>
        ) : (
          <div className="aspect-video flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-emerald-500/10 to-green-500/10">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-emerald-400" />
            </div>
            <span className="text-sm text-muted-foreground">Preparando ilustração...</span>
          </div>
        )}
      </motion.div>
      
      {/* Example content */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-card/40 rounded-xl p-4 border border-emerald-500/20"
      >
        {renderHtmlContent(conteudo)}
      </motion.div>
      
      {/* Example indicator */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="flex items-center gap-2 pt-2 text-muted-foreground"
      >
        <Briefcase className="w-4 h-4" />
        <span className="text-xs">Exemplo prático de aplicação do artigo</span>
      </motion.div>
    </div>
  );
};
