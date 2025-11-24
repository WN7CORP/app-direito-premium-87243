import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { GraduationCap, Sparkles, FileText, Calendar, Headphones, Gavel, Gamepad2, ScrollText, BookOpen, Monitor, Video, Home, Search as SearchIcon, Loader2, Newspaper, Brain } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { VideoPlaylistCarousel } from "@/components/VideoPlaylistCarousel";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { SmartLoadingIndicator } from "@/components/chat/SmartLoadingIndicator";
import { CursosCarousel } from "@/components/CursosCarousel";

const Aprender = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  // Estados para videoaulas - carrossel de áreas
  const [areasPreview, setAreasPreview] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAreasPreview();
  }, []);

  const fetchAreasPreview = async () => {
    try {
      const { data, error } = await supabase
        .from('VIDEO AULAS-NOVO' as any)
        .select('area, thumb, categoria')
        .eq('categoria', 'Áreas');

      if (error) throw error;

      // Agrupar por área, pegar a primeira thumb e contar vídeos
      const areaMap = new Map<string, { thumb: string, count: number }>();
      
      data?.forEach((video: any) => {
        if (!areaMap.has(video.area)) {
          areaMap.set(video.area, { thumb: video.thumb, count: 1 });
        } else {
          const current = areaMap.get(video.area)!;
          areaMap.set(video.area, { ...current, count: current.count + 1 });
        }
      });

      // Criar array de áreas únicas com suas capas e contagem, embaralhado aleatoriamente
      const areasUnicas = Array.from(areaMap.entries())
        .map(([area, data]) => ({ area, thumb: data.thumb, count: data.count }))
        .sort(() => Math.random() - 0.5);

      setAreasPreview(areasUnicas);
    } catch (error) {
      console.error('Erro ao buscar áreas:', error);
    } finally {
      setLoading(false);
    }
  };

  const todasFuncionalidades = [
    {
      id: "videoaulas",
      titulo: "Videoaulas",
      descricao: "Áreas do direito e conteúdos complementares",
      icon: Video,
      path: "/videoaulas",
    },
    {
      id: "cursos",
      titulo: "Cursos em Destaque",
      descricao: "Descomplicando o Direito",
      icon: BookOpen,
      path: "/iniciando-direito",
    },
    {
      id: "resumos",
      titulo: "Resumos Jurídicos",
      descricao: "Crie resumos estruturados de textos",
      icon: ScrollText,
      path: "/resumos-juridicos",
    },
    {
      id: "flashcards",
      titulo: "Flashcards",
      descricao: "Estude com flashcards interativos",
      icon: Sparkles,
      path: "/flashcards",
    },
    {
      id: "mapa-mental",
      titulo: "Mapa Mental",
      descricao: "Mapas mentais organizados por área",
      icon: Brain,
      path: "/mapa-mental",
    },
    {
      id: "plano",
      titulo: "Plano de Estudos",
      descricao: "Organize seu cronograma personalizado",
      icon: Calendar,
      path: "/plano-estudos",
    },
    {
      id: "audioaulas",
      titulo: "Audioaulas",
      descricao: "Aprenda ouvindo em qualquer lugar",
      icon: Headphones,
      path: "/audioaulas",
    },
    {
      id: "questoes",
      titulo: "Questões por Área",
      descricao: "Pratique questões geradas por IA",
      icon: GraduationCap,
      path: "/faculdade/questoes",
    },
    {
      id: "desktop",
      titulo: "Acesso Desktop",
      descricao: "Acesse a plataforma no computador",
      icon: Monitor,
      path: "/acesso-desktop",
    },
  ];



  return (
    <div className="px-3 py-4 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Estudar</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Conteúdo completo para aprender sobre Direito
        </p>
      </div>

      {/* Grid de Todas as Funcionalidades - Estilo Vermelho */}
      <div className="mb-12">
        <div className="mb-4">
          <h2 className="text-xl font-bold mb-1">Todas as Funcionalidades</h2>
          <p className="text-sm text-muted-foreground">
            Acesse rapidamente tudo que você precisa para estudar
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 md:gap-4">
          {todasFuncionalidades.map((func, index) => {
            const Icon = func.icon;
            return (
              <button
                key={func.id}
                onClick={() => navigate(func.path)}
                className="bg-gradient-to-br from-[hsl(0,75%,55%)] to-[hsl(350,70%,45%)] rounded-2xl p-4 text-left transition-all hover:scale-105 hover:shadow-2xl min-h-[120px] flex flex-col justify-between relative overflow-hidden shadow-xl animate-fade-in"
                style={{
                  animationDelay: `${index * 0.05}s`,
                  animationFillMode: 'backwards'
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-tl from-black/60 via-black/30 to-transparent pointer-events-none" />
                
                <div className="bg-white/20 rounded-xl p-2 w-fit relative z-10 shadow-lg mb-2">
                  <Icon className="w-5 h-5 text-white" />
                </div>
                
                <h3 className="text-sm font-bold text-white relative z-10 leading-tight" 
                    style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.6)' }}>
                  {func.titulo}
                </h3>
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
};

export default Aprender;
