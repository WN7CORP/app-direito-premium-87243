import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen, GraduationCap, ArrowRight, RefreshCw } from "lucide-react";
import { useCursosCache } from "@/hooks/useCursosCache";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { cursos, loading: cursosLoading, invalidateCache, lastUpdate } = useCursosCache();

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

  const handleRefresh = async () => {
    setIsRefreshing(true);
    toast.info("Atualizando cursos...", { duration: 1500 });
    
    // Aguardar um momento para feedback visual
    await new Promise(resolve => setTimeout(resolve, 500));
    
    invalidateCache();
    
    // Aguardar carregamento
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success("Cursos atualizados!", { duration: 2000 });
    }, 1500);
  };
  if (loading) {
    return <div className="min-h-screen bg-gradient-to-br from-background via-card to-background flex items-center justify-center">
        <div className="text-center">
          <GraduationCap className="w-16 h-16 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Carregando áreas do Direito...</p>
        </div>
      </div>;
  }
  return <div className="min-h-screen bg-gradient-to-br from-background via-card to-background pb-20">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-[600px] lg:max-w-4xl mx-auto px-4 py-4">
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
        </div>
      </div>

      {/* Conteúdo */}
      <div className="max-w-[600px] lg:max-w-4xl mx-auto px-3 py-4">
        {/* Grid de Áreas - 2 por linha */}
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-foreground">Áreas do Direito</h2>
          
          <div className="grid grid-cols-2 gap-3">
            {areas.map((areaData, index) => (
              <div 
                key={areaData.area} 
                className="animate-fade-in" 
                style={{
                  animationDelay: `${index * 0.08}s`,
                  animationFillMode: 'backwards'
                }}
              >
                {/* Card da área */}
                <div 
                  onClick={() => navigate(`/iniciando-direito/${encodeURIComponent(areaData.area)}/sobre`)} 
                  className="relative overflow-hidden backdrop-blur-sm border-2 rounded-xl p-4 shadow-lg transition-all duration-300 group hover:scale-[1.02] cursor-pointer h-full"
                  style={{
                    background: `linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--card)) 70%, ${areaData.corHex}30 100%)`,
                    borderColor: `${areaData.corHex}40`,
                    transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = areaData.corHex;
                    e.currentTarget.style.boxShadow = CORES_AREAS[areaData.area]?.glow || '0 0 30px rgba(107, 114, 128, 0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = `${areaData.corHex}40`;
                    e.currentTarget.style.boxShadow = '';
                  }}
                >
                  {/* Shimmer effect */}
                  <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" 
                    style={{
                      background: `linear-gradient(90deg, transparent, ${areaData.corHex}20, transparent)`,
                      backgroundSize: '200% 100%',
                      animation: 'shimmer 2s infinite'
                    }} 
                  />
                  
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors duration-300 leading-tight">
                          {areaData.area}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          {areaData.totalTemas} {areaData.totalTemas === 1 ? 'tema' : 'temas'}
                        </p>
                      </div>
                      <span 
                        className="text-white px-2 py-1 rounded-full text-xs font-bold shadow-md" 
                        style={{
                          backgroundColor: areaData.corHex
                        }}
                      >
                        {index + 1}
                      </span>
                    </div>

                    {/* Preview dos 2 primeiros temas */}
                    <div className="space-y-1.5 mt-3 pt-3 border-t border-border/50">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                        Primeiros temas:
                      </p>
                      {areaData.primeirosTemas.slice(0, 2).map((tema, i) => (
                        <div key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                          <BookOpen className="w-3 h-3 flex-shrink-0 mt-0.5" style={{ color: areaData.corHex }} />
                          <span className="flex-1 line-clamp-1">{tema}</span>
                        </div>
                      ))}
                    </div>

                    {/* Botão "Ver curso" */}
                    <div className="mt-3 pt-3 border-t border-border/30">
                      <button 
                        className="relative w-full px-3 py-2 rounded-lg font-semibold text-xs transition-all duration-300 overflow-hidden group/btn flex items-center justify-center gap-1.5"
                        style={{
                          backgroundColor: `${areaData.corHex}20`,
                          color: areaData.corHex,
                          border: `2px solid ${areaData.corHex}40`
                        }}
                        onMouseEnter={(e) => {
                          e.stopPropagation();
                          e.currentTarget.style.backgroundColor = `${areaData.corHex}30`;
                          e.currentTarget.style.borderColor = areaData.corHex;
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = `0 8px 20px ${areaData.corHex}40`;
                        }}
                        onMouseLeave={(e) => {
                          e.stopPropagation();
                          e.currentTarget.style.backgroundColor = `${areaData.corHex}20`;
                          e.currentTarget.style.borderColor = `${areaData.corHex}40`;
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        <GraduationCap className="w-3.5 h-3.5 relative z-10" />
                        <span className="relative z-10">Ver curso</span>
                        <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover/btn:translate-x-1 relative z-10" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sobre este Curso - Movido para depois das áreas */}
        <div 
          className="bg-card/50 backdrop-blur-sm border border-border rounded-lg p-5 mt-6 animate-fade-in"
          style={{
            animationDelay: `${areas.length * 0.08 + 0.2}s`,
            animationFillMode: 'backwards'
          }}
        >
          <h2 className="text-base font-semibold text-foreground mb-2 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary" />
            Sobre este Curso
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            O "Iniciando o Direito" é o curso perfeito para quem está começando a estudar Direito. 
            Explore cada área jurídica através de videoaulas didáticas e conteúdo detalhado gerado 
            especialmente para facilitar seu aprendizado. Escolha uma área acima para começar!
          </p>
        </div>
      </div>
    </div>;
}