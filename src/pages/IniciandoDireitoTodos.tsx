import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, PlayCircle, BookOpen } from "lucide-react";
import { useCursosCache } from "@/hooks/useCursosCache";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import type { CarouselApi } from "@/components/ui/carousel";

interface TemaData {
  tema: string;
  ordem: number;
  'capa-aula': string;
  'aula-link': string;
  area: string;
}

const CORES_AREAS: Record<string, string> = {
  "Direito Penal": "bg-red-600",
  "Direito Civil": "bg-blue-600",
  "Direito Constitucional": "bg-green-600",
  "Direito Administrativo": "bg-purple-600",
  "Direito Trabalhista": "bg-yellow-600",
  "Direito Empresarial": "bg-pink-600",
  "Direito Tributário": "bg-indigo-600",
  "Direito Processual Civil": "bg-cyan-600",
  "Direito Processual Penal": "bg-orange-600",
  "Direito do Trabalho": "bg-amber-600",
  "Processo Civil": "bg-cyan-600"
};

export default function IniciandoDireitoTodos() {
  const navigate = useNavigate();
  const [temas, setTemas] = useState<TemaData[]>([]);
  const [areas, setAreas] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("todos");
  const [loading, setLoading] = useState(true);
  const [api, setApi] = useState<CarouselApi>();
  
  const { cursos, loading: cursosLoading } = useCursosCache();

  useEffect(() => {
    if (!cursosLoading && cursos.length > 0) {
      // Extrair áreas únicas
      const areasUnicas = Array.from(new Set(cursos.map((c: any) => c.area).filter(Boolean)));
      setAreas(areasUnicas.sort());
      
      // Processar todos os temas
      const todosTemas = cursos.map((c: any) => ({
        tema: c.tema,
        ordem: c.ordem,
        'capa-aula': c['capa-aula'],
        'aula-link': c['aula-link'],
        area: c.area
      })).sort((a, b) => {
        // Primeiro ordenar por área, depois por ordem
        if (a.area !== b.area) {
          return a.area.localeCompare(b.area);
        }
        return a.ordem - b.ordem;
      });
      
      setTemas(todosTemas);
      setLoading(false);
    }
  }, [cursos, cursosLoading]);

  const temasFiltrados = activeTab === "todos" 
    ? temas 
    : temas.filter(t => t.area === activeTab);

  const categorias = ["todos", ...areas];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-card to-background pb-20">
        <div className="bg-card border-b border-border sticky top-0 z-10">
          <div className="max-w-[600px] lg:max-w-4xl mx-auto px-4 py-4">
            <p className="text-muted-foreground">Carregando...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background pb-20">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-[600px] lg:max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/iniciando-direito')}
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Button>
          </div>
          
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-foreground">Iniciando o Direito</h1>
            <p className="text-sm text-muted-foreground">
              {activeTab === "todos" 
                ? `${temasFiltrados.length} ${temasFiltrados.length === 1 ? 'tema disponível' : 'temas disponíveis'}`
                : `${temasFiltrados.length} ${temasFiltrados.length === 1 ? 'tema' : 'temas'} em ${activeTab}`
              }
            </p>
          </div>

          {/* Menu de Abas Horizontal */}
          <ScrollArea className="w-full">
            <div className="flex gap-2 pb-2">
              {categorias.map((categoria) => (
                <button
                  key={categoria}
                  onClick={() => setActiveTab(categoria)}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all
                    ${activeTab === categoria 
                      ? 'bg-primary text-primary-foreground shadow-md' 
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }
                  `}
                >
                  {categoria === "todos" ? "Todos" : categoria}
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="max-w-[600px] lg:max-w-6xl mx-auto px-4 py-6">
        {activeTab === "todos" ? (
          /* Carrossel para "Todos" */
          <Carousel 
            opts={{
              align: "start",
              loop: false,
              skipSnaps: false,
              duration: 15
            }}
            className="w-full"
            setApi={setApi}
          >
            <CarouselContent className="-ml-3 md:-ml-4">
              {temasFiltrados.map((temaData, index) => {
                const corArea = CORES_AREAS[temaData.area] || 'bg-gray-600';
                
                return (
                  <CarouselItem key={`${temaData.area}-${index}`} className="pl-3 md:pl-4 basis-[300px] md:basis-[340px]">
                    <Card 
                      className="h-full cursor-pointer transition-all duration-300 overflow-hidden hover:shadow-2xl hover:scale-105 bg-card group"
                      onClick={() => navigate(`/iniciando-direito/${encodeURIComponent(temaData.area)}/aula/${encodeURIComponent(temaData.tema)}`)}
                    >
                      {/* Imagem de capa */}
                      <div className="relative h-[200px] overflow-hidden bg-muted">
                        {temaData['capa-aula'] ? (
                          <>
                            <img 
                              src={temaData['capa-aula']} 
                              alt={temaData.tema} 
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                              loading={index < 6 ? "eager" : "lazy"}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                          </>
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <BookOpen className="w-16 h-16 text-accent/50" />
                          </div>
                        )}
                        <div className="absolute top-3 left-3">
                          <div className={`${corArea} text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg`}>
                            {temaData.area}
                          </div>
                        </div>
                        <div className="absolute top-3 right-3">
                          <div className="bg-black/60 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs font-semibold">
                            Aula {temaData.ordem}
                          </div>
                        </div>
                        <div className="absolute bottom-3 left-3">
                          <PlayCircle className="w-10 h-10 text-white opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300 drop-shadow-lg" />
                        </div>
                      </div>

                      <CardContent className="p-5">
                        <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors duration-300 mb-3 line-clamp-2 leading-tight">
                          {temaData.tema}
                        </h3>
                        
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <PlayCircle className="w-3.5 h-3.5" />
                          <span>Videoaula + Conteúdo</span>
                        </div>
                      </CardContent>
                    </Card>
                  </CarouselItem>
                );
              })}
            </CarouselContent>
            <CarouselPrevious className="left-0 md:-left-4" />
            <CarouselNext className="right-0 md:-right-4" />
          </Carousel>
        ) : (
          /* Timeline para áreas específicas */
          <div className="max-w-[600px] mx-auto">
            <div className="relative space-y-6">
              {/* Linha vertical */}
              <div className="absolute left-[9px] top-0 bottom-0 w-0.5 bg-border" />

              {temasFiltrados.map((temaData, index) => {
                const corArea = CORES_AREAS[temaData.area] || 'bg-gray-600';
                
                return (
                  <div key={`${temaData.area}-${index}`} className="relative pl-8 animate-fade-in-up" style={{
                    animationDelay: `${index * 0.08}s`,
                    animationFillMode: 'backwards'
                  }}>
                    {/* Marcador colorido */}
                    <div 
                      className={`absolute left-0 top-4 w-7 h-7 rounded-full ${corArea} border-4 border-background flex items-center justify-center shadow-xl animate-bounce-in`}
                      style={{
                        animationDelay: `${index * 0.08 + 0.2}s`,
                        animationFillMode: 'backwards'
                      }}
                    >
                      <span className="text-xs font-bold text-white">{temaData.ordem}</span>
                    </div>
                    
                    {/* Card do tema */}
                    <button 
                      onClick={() => navigate(`/iniciando-direito/${encodeURIComponent(temaData.area)}/aula/${encodeURIComponent(temaData.tema)}`)} 
                      className="w-full text-left relative overflow-hidden backdrop-blur-sm border-2 border-border/50 rounded-lg hover:border-primary hover:shadow-2xl shadow-xl transition-all duration-300 group hover:scale-[1.02] bg-card"
                    >
                      {/* Imagem de capa */}
                      {temaData['capa-aula'] && (
                        <div className="relative h-40 overflow-hidden bg-muted">
                          <img 
                            src={temaData['capa-aula']} 
                            alt={temaData.tema} 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                            loading={index < 5 ? "eager" : "lazy"}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                          <div className="absolute top-3 right-3">
                            <div className={`${corArea} text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg`}>
                              Aula {temaData.ordem}
                            </div>
                          </div>
                          <div className="absolute bottom-3 left-3 right-3">
                            <PlayCircle className="w-10 h-10 text-white opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300 drop-shadow-lg" />
                          </div>
                        </div>
                      )}

                      {/* Conteúdo */}
                      <div className="p-5 relative z-10">
                        <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors duration-300 mb-2">
                          {temaData.tema}
                        </h3>
                        
                        <div className="flex items-center gap-2 text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                          <PlayCircle className="w-3.5 h-3.5" />
                          <span>Videoaula + Conteúdo Detalhado</span>
                        </div>

                        <div className="mt-3 text-right">
                          <span className="text-xs text-primary font-semibold group-hover:underline inline-flex items-center gap-1">
                            Começar aula →
                          </span>
                        </div>
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>

            {temasFiltrados.length === 0 && (
              <div className="text-center py-12">
                <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">Nenhum tema encontrado para esta área.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
