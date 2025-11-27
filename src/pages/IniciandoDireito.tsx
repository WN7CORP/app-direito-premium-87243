import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GraduationCap, BookOpen, CheckCircle2, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCursosCache } from "@/hooks/useCursosCache";

interface AreaData {
  area: string;
  temasCount: number;
  color: string;
  glow: string;
  description: string;
  icon: string;
}

const CORES_AREAS: Record<string, { color: string; glow: string; description: string; icon: string }> = {
  "Direito Penal": { 
    color: "from-red-500 to-rose-600", 
    glow: "shadow-red-500/20",
    description: "Fundamentos do Direito Penal, crimes e suas penalidades",
    icon: "⚖️"
  },
  "Direito Civil": { 
    color: "from-blue-500 to-cyan-600", 
    glow: "shadow-blue-500/20",
    description: "Relações entre particulares, contratos e responsabilidades",
    icon: "📋"
  },
  "Direito do Trabalho": { 
    color: "from-amber-500 to-orange-600", 
    glow: "shadow-amber-500/20",
    description: "Relações trabalhistas, direitos e deveres",
    icon: "💼"
  },
  "Direito Constitucional": { 
    color: "from-emerald-500 to-green-600", 
    glow: "shadow-emerald-500/20",
    description: "Fundamentos da Constituição Federal",
    icon: "🏛️"
  }
};

const LEARNING_TOPICS = [
  "Fundamentos essenciais de cada área do Direito",
  "Conceitos práticos aplicáveis ao dia a dia",
  "Estrutura e organização do sistema jurídico brasileiro",
  "Base sólida para aprofundamento em temas específicos",
  "Metodologia didática e acessível para todos os níveis"
];

export default function IniciandoDireito() {
  const navigate = useNavigate();
  const [areas, setAreas] = useState<AreaData[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { cursos, loading: cursosLoading } = useCursosCache();

  useEffect(() => {
    if (!cursosLoading && cursos.length > 0) {
      processarAreas();
    }
  }, [cursos, cursosLoading]);

  const processarAreas = () => {
    const areasMap = new Map<string, number>();
    
    cursos.forEach((curso: any) => {
      if (curso.area) {
        areasMap.set(curso.area, (areasMap.get(curso.area) || 0) + 1);
      }
    });

    const areasProcessadas: AreaData[] = Array.from(areasMap.entries()).map(([area, count]) => ({
      area,
      temasCount: count,
      color: CORES_AREAS[area]?.color || "from-gray-500 to-gray-600",
      glow: CORES_AREAS[area]?.glow || "shadow-gray-500/20",
      description: CORES_AREAS[area]?.description || "Explore os fundamentos desta área do Direito",
      icon: CORES_AREAS[area]?.icon || "📚"
    }));

    setAreas(areasProcessadas);
    setLoading(false);
  };

  const handleAreaClick = (area: string) => {
    navigate(`/iniciando-direito/${encodeURIComponent(area)}/sobre`);
  };

  const scrollToModules = () => {
    document.getElementById('modulos')?.scrollIntoView({ behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="text-center space-y-4">
          <GraduationCap className="w-16 h-16 text-primary mx-auto animate-pulse" />
          <p className="text-muted-foreground">Carregando módulos do curso...</p>
        </div>
      </div>
    );
  }

  const totalTemas = areas.reduce((acc, area) => acc + area.temasCount, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-accent pt-20 pb-32 px-4">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.08),transparent_40%)]" />
        
        <div className="container mx-auto max-w-4xl relative z-10">
          <div className="text-center space-y-6 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
              <Sparkles className="w-4 h-4 text-white" />
              <span className="text-white text-sm font-medium">Comece sua jornada jurídica</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight">
              Iniciando o Direito
            </h1>
            
            <p className="text-xl md:text-2xl text-white/90 max-w-2xl mx-auto">
              Sua jornada no mundo jurídico começa aqui
            </p>
            
            <div className="flex flex-wrap justify-center gap-6 pt-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-white">{areas.length}</div>
                <div className="text-sm text-white/80">Áreas</div>
              </div>
              <div className="w-px bg-white/20" />
              <div className="text-center">
                <div className="text-3xl font-bold text-white">{totalTemas}+</div>
                <div className="text-sm text-white/80">Temas</div>
              </div>
            </div>

            <Button 
              size="lg" 
              className="bg-white text-primary hover:bg-white/90 shadow-xl mt-8 px-8 py-6 text-lg font-semibold group"
              onClick={scrollToModules}
            >
              Começar Agora
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </section>

      {/* Módulos do Curso */}
      <section id="modulos" className="py-16 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground flex items-center justify-center gap-3">
              <BookOpen className="w-8 h-8 text-primary" />
              Módulos do Curso
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Explore cada área do Direito de forma estruturada e didática
            </p>
          </div>

          <div className="grid gap-4 md:gap-6 lg:gap-8">
            {areas.map((area, index) => (
              <Card 
                key={area.area}
                className="group cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl border-2 overflow-hidden animate-fade-in"
                style={{
                  animationDelay: `${index * 0.1}s`,
                  animationFillMode: 'backwards'
                }}
                onClick={() => handleAreaClick(area.area)}
              >
                <div className={`h-2 bg-gradient-to-r ${area.color}`} />
                <CardContent className="p-4 sm:p-6 md:p-8">
                  <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start">
                    <div className="flex-shrink-0">
                      <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br ${area.color} flex items-center justify-center text-2xl sm:text-3xl shadow-lg ${area.glow}`}>
                        {area.icon}
                      </div>
                    </div>
                    
                    <div className="flex-1 space-y-3 min-w-0">
                      <div className="flex items-start justify-between gap-2 sm:gap-4 flex-wrap">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
                            <span className={`text-xs sm:text-sm font-bold px-2 sm:px-3 py-1 rounded-full bg-gradient-to-r ${area.color} text-white whitespace-nowrap`}>
                              Módulo {index + 1}
                            </span>
                          </div>
                          <h3 className="text-xl sm:text-2xl font-bold text-foreground group-hover:text-primary transition-colors break-words">
                            {area.area}
                          </h3>
                        </div>
                      </div>
                      
                      <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                        {area.description}
                      </p>
                      
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 pt-2 sm:pt-4">
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                          <BookOpen className="w-4 h-4 flex-shrink-0" />
                          <span className="font-medium">{area.temasCount} temas disponíveis</span>
                        </div>
                        
                        <Button 
                          variant="ghost" 
                          className="group/btn font-semibold text-sm sm:text-base w-full sm:w-auto"
                          size="sm"
                        >
                          Acessar Módulo
                          <ArrowRight className="ml-2 w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* O que você vai aprender */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              O que você vai aprender
            </h2>
            <p className="text-muted-foreground text-lg">
              Desenvolva uma base sólida no conhecimento jurídico
            </p>
          </div>

          <div className="grid gap-4 md:gap-6">
            {LEARNING_TOPICS.map((topic, index) => (
              <div 
                key={index}
                className="flex items-start gap-4 p-4 md:p-6 bg-card rounded-xl border shadow-sm animate-fade-in hover:shadow-md transition-shadow"
                style={{
                  animationDelay: `${index * 0.1}s`,
                  animationFillMode: 'backwards'
                }}
              >
                <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <p className="text-foreground text-lg">{topic}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sobre o Curso */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <Card className="border-2">
            <CardContent className="p-8 md:p-12 space-y-6">
              <div className="text-center space-y-4">
                <GraduationCap className="w-12 h-12 text-primary mx-auto" />
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                  Sobre este Curso
                </h2>
              </div>
              
              <div className="prose prose-lg max-w-none text-muted-foreground space-y-4">
                <p className="text-center leading-relaxed">
                  O curso <strong className="text-foreground">Iniciando o Direito</strong> foi desenvolvido para proporcionar 
                  uma base sólida e acessível sobre as principais áreas do Direito brasileiro. 
                  Com uma metodologia didática e exemplos práticos, você compreenderá os 
                  conceitos fundamentais de cada área.
                </p>
                
                <p className="text-center leading-relaxed">
                  Ideal para estudantes, concurseiros e qualquer pessoa interessada em 
                  entender melhor o sistema jurídico nacional.
                </p>
              </div>

              <div className="text-center pt-6">
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={scrollToModules}
                  className="font-semibold"
                >
                  <ArrowRight className="mr-2 w-5 h-5 rotate-180" />
                  Voltar aos Módulos
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
