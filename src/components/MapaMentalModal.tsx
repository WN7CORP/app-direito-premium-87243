import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Share2, Loader2, Network, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface MapaMentalModalProps {
  isOpen: boolean;
  onClose: () => void;
  codigoTabela: string;
  numeroArtigo: string;
  conteudoArtigo: string;
}

export const MapaMentalModal = ({
  isOpen,
  onClose,
  codigoTabela,
  numeroArtigo,
  conteudoArtigo,
}: MapaMentalModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [imagemUrl, setImagemUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const gerarMapaMental = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('gerar-mapa-mental-artigo', {
        body: {
          codigoTabela,
          numeroArtigo,
          conteudoArtigo,
        },
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      if (data?.imagemUrl) {
        setImagemUrl(data.imagemUrl);
        if (data.cached) {
          toast.success("Mapa mental carregado do cache!");
        } else {
          toast.success("Mapa mental gerado com sucesso!");
        }
      }
    } catch (err) {
      console.error("Erro ao gerar mapa mental:", err);
      setError(err instanceof Error ? err.message : "Erro ao gerar mapa mental");
      toast.error("Erro ao gerar mapa mental. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  // Carregar automaticamente ao abrir o modal
  useEffect(() => {
    if (isOpen && !imagemUrl && !isLoading && !error) {
      gerarMapaMental();
    }
  }, [isOpen]);

  const handleDownload = async () => {
    if (!imagemUrl) return;

    try {
      const response = await fetch(imagemUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mapa-mental-${numeroArtigo.replace(/\s+/g, '-')}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success("Download iniciado!");
    } catch {
      toast.error("Erro ao baixar imagem");
    }
  };

  const handleShare = () => {
    if (!imagemUrl) return;

    const texto = `📊 Mapa Mental - ${codigoTabela} - ${numeroArtigo}\n\n🔗 ${imagemUrl}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(texto)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Network className="w-5 h-5 text-primary" />
            Mapa Mental - {numeroArtigo}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
              <div className="text-center">
                <p className="font-medium">Gerando mapa mental...</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Isso pode levar alguns segundos
                </p>
              </div>
            </div>
          )}

          {error && !isLoading && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <div className="text-center text-destructive">
                <p className="font-medium">Erro ao gerar mapa mental</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
              <Button onClick={gerarMapaMental} variant="outline" className="gap-2">
                <RefreshCw className="w-4 h-4" />
                Tentar novamente
              </Button>
            </div>
          )}

          {imagemUrl && !isLoading && (
            <div className="space-y-4">
              <div className="rounded-lg overflow-hidden border bg-card">
                <img
                  src={imagemUrl}
                  alt={`Mapa Mental - ${numeroArtigo}`}
                  className="w-full h-auto"
                  loading="lazy"
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleDownload} variant="outline" className="flex-1 gap-2">
                  <Download className="w-4 h-4" />
                  Baixar
                </Button>
                <Button onClick={handleShare} variant="outline" className="flex-1 gap-2">
                  <Share2 className="w-4 h-4" />
                  Compartilhar
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};