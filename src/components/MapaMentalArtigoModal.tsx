import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Network, ChevronDown, ChevronRight, Loader2, RefreshCw, ExternalLink } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SubRamo {
  titulo: string;
  descricao: string;
}

interface Ramo {
  titulo: string;
  cor: string;
  subramos: SubRamo[];
}

interface Conexao {
  artigo: string;
  relacao: string;
}

interface MapaMental {
  conceitoCentral: {
    titulo: string;
    descricao: string;
  };
  ramos: Ramo[];
  conexoes: Conexao[];
}

interface MapaMentalArtigoModalProps {
  isOpen: boolean;
  onClose: () => void;
  artigo: string;
  numeroArtigo: string;
  codigoNome: string;
  codigoTabela: string;
}

export const MapaMentalArtigoModal = ({
  isOpen,
  onClose,
  artigo,
  numeroArtigo,
  codigoNome,
  codigoTabela
}: MapaMentalArtigoModalProps) => {
  const [mapaMental, setMapaMental] = useState<MapaMental | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedRamos, setExpandedRamos] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && artigo && numeroArtigo) {
      gerarMapaMental();
    }
  }, [isOpen, artigo, numeroArtigo]);

  useEffect(() => {
    if (!isOpen) {
      setMapaMental(null);
      setExpandedRamos(new Set());
      setError(null);
    }
  }, [isOpen]);

  const gerarMapaMental = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: fnError } = await supabase.functions.invoke('gerar-mapa-mental-artigo', {
        body: { artigo, numeroArtigo, codigoNome, codigoTabela }
      });

      if (fnError) throw fnError;

      if (data?.mapaMental) {
        setMapaMental(data.mapaMental);
        // Expand all ramos by default
        setExpandedRamos(new Set(data.mapaMental.ramos.map((_: Ramo, i: number) => i)));
      }
    } catch (err) {
      console.error('Erro ao gerar mapa mental:', err);
      setError('Erro ao gerar mapa mental. Tente novamente.');
      toast.error('Erro ao gerar mapa mental');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleRamo = (index: number) => {
    setExpandedRamos(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden p-0 bg-card border-border">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-[hsl(45,93%,58%)]/20">
                <Network className="w-5 h-5 text-[hsl(45,93%,58%)]" />
              </div>
              <div>
                <h2 className="font-bold text-lg text-foreground">Mapa Mental</h2>
                <p className="text-sm text-muted-foreground">Art. {numeroArtigo} • {codigoNome}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!isLoading && mapaMental && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={gerarMapaMental}
                  className="h-8 w-8 p-0"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              )}
              <button
                onClick={onClose}
                className="p-2 hover:bg-secondary rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6" style={{ maxHeight: 'calc(90vh - 80px)' }}>
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-16 gap-4"
              >
                <div className="relative">
                  <div className="w-16 h-16 rounded-full border-4 border-[hsl(45,93%,58%)]/20" />
                  <Loader2 className="w-16 h-16 text-[hsl(45,93%,58%)] animate-spin absolute top-0 left-0" />
                </div>
                <p className="text-muted-foreground animate-pulse">Gerando mapa mental...</p>
              </motion.div>
            ) : error ? (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-16 gap-4"
              >
                <p className="text-destructive">{error}</p>
                <Button onClick={gerarMapaMental} variant="outline">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Tentar novamente
                </Button>
              </motion.div>
            ) : mapaMental ? (
              <motion.div
                key="content"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                {/* Conceito Central */}
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="flex justify-center"
                >
                  <div className="relative">
                    <div className="px-6 py-4 rounded-2xl bg-gradient-to-br from-[hsl(45,93%,58%)] to-[hsl(45,88%,48%)] text-black shadow-lg shadow-[hsl(45,93%,58%)]/30 max-w-md text-center">
                      <h3 className="font-bold text-lg">{mapaMental.conceitoCentral.titulo}</h3>
                      <p className="text-sm text-black/70 mt-1">{mapaMental.conceitoCentral.descricao}</p>
                    </div>
                    {/* Linha vertical conectora */}
                    <div className="absolute left-1/2 -translate-x-1/2 w-0.5 h-8 bg-gradient-to-b from-[hsl(45,93%,58%)] to-border -bottom-8" />
                  </div>
                </motion.div>

                {/* Ramos */}
                <div className="space-y-4 pt-6">
                  {mapaMental.ramos.map((ramo, index) => {
                    const isExpanded = expandedRamos.has(index);
                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 + index * 0.1 }}
                        className="relative"
                      >
                        {/* Linha horizontal conectora */}
                        <div 
                          className="absolute left-0 top-6 w-4 h-0.5"
                          style={{ backgroundColor: ramo.cor }}
                        />
                        
                        <div className="ml-6">
                          {/* Ramo Header */}
                          <button
                            onClick={() => toggleRamo(index)}
                            className="w-full flex items-center gap-3 p-3 rounded-xl transition-all hover:scale-[1.02]"
                            style={{ 
                              backgroundColor: `${ramo.cor}15`,
                              borderLeft: `3px solid ${ramo.cor}`
                            }}
                          >
                            <div 
                              className="w-8 h-8 rounded-lg flex items-center justify-center"
                              style={{ backgroundColor: ramo.cor }}
                            >
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-white" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-white" />
                              )}
                            </div>
                            <span className="font-semibold text-foreground">{ramo.titulo}</span>
                            <span className="text-xs text-muted-foreground ml-auto">
                              {ramo.subramos.length} itens
                            </span>
                          </button>

                          {/* Sub-ramos */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                <div className="ml-4 mt-2 space-y-2 border-l-2 border-dashed pl-4" style={{ borderColor: `${ramo.cor}40` }}>
                                  {ramo.subramos.map((subramo, subIndex) => (
                                    <motion.div
                                      key={subIndex}
                                      initial={{ opacity: 0, x: -10 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ delay: subIndex * 0.05 }}
                                      className="p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                                    >
                                      <h4 className="font-medium text-sm text-foreground">{subramo.titulo}</h4>
                                      <p className="text-xs text-muted-foreground mt-1">{subramo.descricao}</p>
                                    </motion.div>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Conexões */}
                {mapaMental.conexoes && mapaMental.conexoes.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="pt-6 border-t border-border"
                  >
                    <h4 className="font-semibold text-sm text-muted-foreground mb-3 flex items-center gap-2">
                      <ExternalLink className="w-4 h-4" />
                      Conexões com outros artigos
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {mapaMental.conexoes.map((conexao, index) => (
                        <div
                          key={index}
                          className="px-3 py-2 rounded-lg bg-primary/10 border border-primary/20 text-sm"
                        >
                          <span className="font-medium text-primary">{conexao.artigo}</span>
                          <span className="text-muted-foreground ml-2">• {conexao.relacao}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
};
