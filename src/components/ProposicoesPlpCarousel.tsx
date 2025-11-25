import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import useEmblaCarousel from 'embla-carousel-react';
import ProposicaoCarouselCard from "./ProposicaoCarouselCard";

const ProposicoesPlpCarousel = () => {
  const navigate = useNavigate();
  const [emblaRef] = useEmblaCarousel({
    align: 'start',
    containScroll: 'trimSnaps',
    dragFree: true,
    slidesToScroll: 1
  });

  const { data, isLoading } = useQuery({
    queryKey: ['plp-recentes'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('buscar-plp-recentes');
      
      if (error) throw error;
      
      return data || { proposicoes: [], finalizado: false };
    },
    staleTime: 1000 * 60 * 30, // 30 minutos
    refetchInterval: 1000 * 60 * 30, // Atualizar a cada 30 minutos
  });

  const proposicoes = data?.proposicoes || [];
  const isFinalizado = data?.finalizado === true;

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-accent" />
      </div>
    );
  }

  if (!proposicoes || proposicoes.length === 0) {
    if (isLoading) return null;
    
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="md:text-lg text-foreground font-normal text-base">Leis Complementares Recentes (PLP)</h2>
        </div>
        <div className="bg-card border border-border rounded-lg p-6 text-center">
          <p className="text-sm text-muted-foreground">
            {isFinalizado 
              ? "Nenhuma lei complementar encontrada nos últimos 30 dias." 
              : "Carregando dados pela primeira vez... Isso pode levar alguns minutos."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h2 className="md:text-lg text-foreground font-normal text-base">Leis Complementares Recentes (PLP)</h2>
        <button 
          onClick={() => navigate("/camara-deputados/proposicoes")} 
          className="text-accent font-medium flex items-center text-sm md:text-xs"
        >
          Ver todas <span className="text-lg md:text-base ml-0.5">›</span>
        </button>
      </div>
      
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-3 md:gap-4">
          {proposicoes.map((proposicao: any) => (
            <ProposicaoCarouselCard
              key={proposicao.id_proposicao}
              id={proposicao.id_proposicao}
              siglaTipo={proposicao.sigla_tipo}
              numero={proposicao.numero}
              ano={proposicao.ano}
              tituloGeradoIA={proposicao.titulo_gerado_ia}
              ementa={proposicao.ementa}
              autorNome={proposicao.autor_principal_nome}
              autorFoto={proposicao.autor_principal_foto}
              dataApresentacao={proposicao.data_apresentacao}
              onClick={() => navigate(`/camara-deputados/proposicao/${proposicao.id_proposicao}`)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProposicoesPlpCarousel;
