import { useState, useRef, useEffect } from "react";
import { Volume2, Pause, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SlideAudioButtonProps {
  aulaId: string;
  slideKey: string;
  conteudo: string;
  audioUrl?: string;
  onAudioGenerated?: (url: string) => void;
}

export const SlideAudioButton = ({
  aulaId,
  slideKey,
  conteudo,
  audioUrl: propAudioUrl,
  onAudioGenerated
}: SlideAudioButtonProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState(propAudioUrl || "");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (propAudioUrl) {
      setAudioUrl(propAudioUrl);
    }
  }, [propAudioUrl]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const handleToggleAudio = async () => {
    // Se está tocando, pausar
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }

    // Se já tem URL, tocar
    if (audioUrl) {
      playAudio(audioUrl);
      return;
    }

    // Gerar áudio
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('gerar-audio-aula-artigo', {
        body: { aulaId, slideKey, conteudo }
      });

      if (error) throw error;
      if (!data?.url) throw new Error('URL do áudio não retornada');

      setAudioUrl(data.url);
      onAudioGenerated?.(data.url);
      playAudio(data.url);
    } catch (error) {
      console.error('Erro ao gerar áudio:', error);
      toast.error('Erro ao gerar narração');
    } finally {
      setIsLoading(false);
    }
  };

  const playAudio = (url: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(url);
    audioRef.current = audio;

    audio.onended = () => setIsPlaying(false);
    audio.onerror = () => {
      setIsPlaying(false);
      toast.error('Erro ao reproduzir áudio');
    };

    audio.play();
    setIsPlaying(true);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleToggleAudio}
      disabled={isLoading}
      className="gap-2 text-muted-foreground hover:text-primary"
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-xs">Gerando...</span>
        </>
      ) : isPlaying ? (
        <>
          <Pause className="w-4 h-4" />
          <span className="text-xs">Pausar</span>
        </>
      ) : (
        <>
          <Volume2 className="w-4 h-4" />
          <span className="text-xs">Ouvir</span>
        </>
      )}
    </Button>
  );
};
