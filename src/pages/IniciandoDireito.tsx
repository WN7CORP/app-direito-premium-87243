import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BookOpen, GraduationCap, LayoutGrid, LayoutList, ChevronLeft, ChevronRight } from "lucide-react";
import { useCursosCache } from "@/hooks/useCursosCache";
import useEmblaCarousel from "embla-carousel-react";

interface AreaData {
  area: string;
  totalTemas: number;
  primeirosTemas: string[];
  cor: string;
  corHex: string;
}

const CORES_AREAS: Record<string, { hex: string; glow: string }> = {
  "Direito Penal": { 
    hex: "#ef4444",
    glow: "0 0 30px rgba(239, 68, 68, 0.5)"
  },
  "Direito Civil": { 
    hex: "#3b82f6",
    glow: "0 0 30px rgba(59, 130, 246, 0.5)"
  },
  "Direito Constitucional": { 
    hex: "#10b981",
    glow: "0 0 30px rgba(16, 185, 129, 0.5)"
  },
  "Direito Administrativo": { 
    hex: "#a855f7",
    glow: "0 0 30px rgba(168, 85, 247, 0.5)"
  },
  "Direito Trabalhista": { 
    hex: "#f59e0b",
    glow: "0 0 30px rgba(245, 158, 11, 0.5)"
  },
  "Direito Empresarial": { 
    hex: "#ec4899",
    glow: "0 0 30px rgba(236, 72, 153, 0.5)"
  },
  "Direito Tributário": { 
    hex: "#6366f1",
    glow: "0 0 30px rgba(99, 102, 241, 0.5)"
  },
  "Direito Processual Civil": { 
    hex: "#06b6d4",
    glow: "0 0 30px rgba(6, 182, 212, 0.5)"
  },
  "Processo Civil": { 
    hex: "#06b6d4",
    glow: "0 0 30px rgba(6, 182, 212, 0.5)"
  },
  "Direito Processual Penal": { 
    hex: "#f97316",
    glow: "0 0 30px rgba(249, 115, 22, 0.5)"
  },
  "Direito do Trabalho": { 
    hex: "#f59e0b",
    glow: "0 0 30px rgba(245, 158, 11, 0.5)"
  }
};

export default function IniciandoDireito() {
  const navigate = useNavigate();
  const [areas, setAreas] = useState<AreaData[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'carousel' | 'grid'>('carousel');
  const { cursos, loading: cursosLoading } = useCursosCache();
  
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    containScroll: 'trimSnaps',
    dragFree: false,
    loop: false
  });

  const scrollPrev = () => emblaApi?.scrollPrev();
  const scrollNext = () => emblaApi?.scrollNext();

  useEffect(() => {
    if (!cursosLoading) {
      processarAreas();
    }
  }, [cursosLoading, cursos]);

  const processarAreas = () => {
    if (cursos.length === 0) {
      setAreas([]);
      setLoading(false);
      return;
    }

    // Agrupar por área
    const areasMap = new Map<string, {
      temas: string[];
      total: number;
    }>();
    
    cursos.forEach((curso: any) => {
      const area = curso.area;
      if (!areasMap.has(area)) {
        areasMap.set(area, {
          temas: [],
          total: 0
        });
      }
      const areaData = areasMap.get(area)!;
      areaData.temas.push(curso.tema);
      areaData.total++;
    });

    // Converter para array
    const areasArray: AreaData[] = Array.from(areasMap.entries()).map(([area, dados]) => {
      const corData = CORES_AREAS[area] || { hex: '#6b7280', glow: '0 0 30px rgba(107, 114, 128, 0.5)' };
      return {
        area,
        totalTemas: dados.total,
        primeirosTemas: dados.temas.slice(0, 3),
        cor: `bg-[${corData.hex}]`,
        corHex: corData.hex
      };
    });
    
    setAreas(areasArray);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-card to-background flex items-center justify-center">
        <div className="text-center">
          <GraduationCap className="w-16 h-16 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Carregando áreas do Direito...</p>
        </div>
      </div>
    );
  }

  const AreaCard = ({ areaData, index }: { areaData: AreaData; index: number }) => (
    <button
      onClick={() => navigate(`/iniciando-direito/${encodeURIComponent(areaData.area)}/sobre`)}
      className="group relative bg-card/50 backdrop-blur-sm border-3 rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl flex flex-col items-center justify-center gap-4 min-h-[180px] overflow-hidden animate-fade-in"
      style={{
        borderWidth: '3px',
        borderColor: areaData.corHex + '80',
        animationDelay: `${index * 50}ms`
      }}
    >
      {/* Gradiente de fundo sutil */}
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500"
        style={{
          background: `linear-gradient(135deg, ${areaData.corHex}40, transparent)`
        }}
      />
      
      {/* Ícone grande centralizado */}
      <div 
        className="relative rounded-full p-4 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 shadow-lg"
        style={{
          backgroundColor: areaData.corHex + '25'
        }}
      >
        <GraduationCap 
          className="w-10 h-10 transition-all duration-300" 
          style={{ color: areaData.corHex }}
        />
      </div>

      {/* Nome da área */}
      <div className="relative text-center space-y-2">
        <h3 className="font-bold text-base leading-tight text-foreground">
          {areaData.area.replace('Direito ', '')}
        </h3>
        <p 
          className="text-sm font-bold"
          style={{ color: areaData.corHex }}
        >
          {areaData.totalTemas} aulas
        </p>
      </div>

      {/* Glow effect on hover */}
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-30 blur-2xl transition-opacity duration-500 pointer-events-none"
        style={{ 
          backgroundColor: areaData.corHex,
          boxShadow: `0 0 60px ${areaData.corHex}`
        }}
      />
    </button>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background pb-20">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-[600px] lg:max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center animate-scale-in shadow-lg">
                <GraduationCap className="w-6 h-6 text-primary-foreground animate-pulse" />
              </div>
              <div className="animate-fade-in-up">
                <h1 className="text-2xl font-bold text-foreground bg-gradient-to-r from-foreground to-primary bg-clip-text">
                  Iniciando o Direito
                </h1>
                <p className="text-sm text-muted-foreground">Sua jornada no mundo jurídico começa aqui</p>
              </div>
            </div>

            {/* Toggle de visualização */}
            <div className="flex items-center gap-2 bg-secondary/30 rounded-lg p-1">
              <Button
                variant={viewMode === 'carousel' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('carousel')}
                className="gap-2"
              >
                <LayoutList className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="gap-2"
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="max-w-[600px] lg:max-w-4xl mx-auto px-4 py-6">
        {/* Áreas do Direito */}
        <div className="space-y-6 mb-8">
          <h2 className="text-xl font-bold text-foreground">Áreas do Direito</h2>
          
          {viewMode === 'carousel' ? (
            <div className="relative">
              {/* Carrossel */}
              <div className="overflow-hidden" ref={emblaRef}>
                <div className="flex gap-4">
                  {areas.map((areaData, index) => (
                    <div key={areaData.area} className="flex-[0_0_100%] md:flex-[0_0_45%] lg:flex-[0_0_30%] min-w-0">
                      <AreaCard areaData={areaData} index={index} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Botões de navegação */}
              {areas.length > 1 && (
                <>
                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm hover:bg-background/95 border-accent/50 shadow-xl hidden md:flex"
                    onClick={scrollPrev}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm hover:bg-background/95 border-accent/50 shadow-xl hidden md:flex"
                    onClick={scrollNext}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {areas.map((areaData, index) => (
                <AreaCard key={areaData.area} areaData={areaData} index={index} />
              ))}
            </div>
          )}
        </div>

        {/* Sobre o Curso - Abaixo */}
        <div className="bg-card/50 backdrop-blur-sm border border-border rounded-lg p-6">
          <h2 className="text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            Sobre este Curso
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            O "Iniciando o Direito" é o curso perfeito para quem está começando a estudar Direito. 
            Explore cada área jurídica através de videoaulas didáticas e conteúdo detalhado gerado 
            especialmente para facilitar seu aprendizado. Escolha uma área acima para começar!
          </p>
        </div>
      </div>
    </div>
  );
}
