import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, ExternalLink } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface NoticiaCardProps {
  id: string;
  titulo: string;
  capa: string;
  portal: string;
  categoria: string;
  dataHora: string;
  analise_ia?: string;
  onClick: () => void;
}

const NoticiaCard = ({ titulo, capa, portal, categoria, dataHora, analise_ia, onClick }: NoticiaCardProps) => {
  const formatarDataHora = (data: string) => {
    try {
      if (!data) return 'Sem data';
      
      // Se for uma data ISO com hora
      if (data.includes('T')) {
        const date = parseISO(data);
        if (isNaN(date.getTime())) return 'Sem data';
        return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
      }
      
      // Se for uma data com hora no formato brasileiro (dd/MM/yyyy HH:mm)
      if (data.includes('/') && data.includes(':')) {
        return data; // Já está formatado
      }
      
      // Se for apenas data no formato ISO
      if (data.includes('-')) {
        const date = parseISO(data);
        if (isNaN(date.getTime())) return 'Sem data';
        return format(date, "dd/MM/yyyy", { locale: ptBR });
      }
      
      // Se for apenas data no formato brasileiro dd/MM/yyyy
      if (data.includes('/')) {
        return data;
      }
      
      return data;
    } catch {
      return 'Sem data';
    }
  };

  const getCategoryColor = (cat: string) => {
    const colors: Record<string, string> = {
      'Investimentos': 'bg-red-600',
      'Direito': 'bg-red-600',
      'Concurso': 'bg-red-600',
      'Concursos': 'bg-red-600',
      'OAB': 'bg-red-600',
      'Geral': 'bg-red-600',
    };
    return colors[cat] || 'bg-red-600';
  };

  return (
    <Card 
      onClick={onClick}
      className="cursor-pointer hover:scale-[1.01] hover:shadow-xl transition-all border border-border hover:border-primary/50 bg-card group overflow-hidden"
    >
      <CardContent className="p-0">
        {/* Layout Horizontal: Imagem à esquerda, conteúdo à direita */}
        <div className="flex gap-3">
          {/* Imagem de capa - à esquerda */}
          {capa && (
            <div className="relative w-32 md:w-40 flex-shrink-0 overflow-hidden bg-muted">
              <img
                src={capa}
                alt={titulo}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}
          
          {/* Conteúdo - à direita */}
          <div className="flex-1 p-3 space-y-2 min-w-0">
            {/* Categoria e Badge de Análise */}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={`${getCategoryColor(categoria)} text-white text-xs px-2 py-0.5`}>
                {categoria}
              </Badge>
              {analise_ia && (
                <Badge variant="outline" className="text-xs px-2 py-0.5 bg-primary/10 text-primary border-primary/30">
                  ✨ Análise IA
                </Badge>
              )}
            </div>

            {/* Título */}
            <h3 className="font-semibold text-sm md:text-base text-foreground line-clamp-2 group-hover:text-primary transition-colors leading-tight text-left">
              {titulo}
            </h3>

            {/* Portal e Data/Hora */}
            <div className="flex items-center justify-between text-xs text-muted-foreground gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 min-w-0">
                <ExternalLink className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{portal}</span>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <Calendar className="w-3 h-3" />
                <span className="whitespace-nowrap">{formatarDataHora(dataHora)}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NoticiaCard;
