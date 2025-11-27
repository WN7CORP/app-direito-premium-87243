import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Search, ArrowLeft, Sparkles, Target, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface Area {
  area: string;
  count: number;
}

interface Tema {
  tema: string;
  count: number;
}

const ResumosProntos = () => {
  const navigate = useNavigate();
  const [areaSelecionada, setAreaSelecionada] = useState<string | null>(null);
  const [searchArea, setSearchArea] = useState("");
  const [searchTema, setSearchTema] = useState("");
  const [visibleElements, setVisibleElements] = useState<Set<string>>(new Set());
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Intersection Observer para animações
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute('data-animate');
            if (id) {
              setVisibleElements((prev) => new Set([...prev, id]));
            }
          }
        });
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    document.querySelectorAll('[data-animate]').forEach((el) => {
      observerRef.current?.observe(el);
    });

    return () => observerRef.current?.disconnect();
  }, [areaSelecionada]);

  // Scroll suave para seção de áreas
  const scrollToAreas = () => {
    document.getElementById('areas-section')?.scrollIntoView({ 
      behavior: 'smooth',
      block: 'start'
    });
  };

  // Buscar áreas únicas - COM PAGINAÇÃO para pegar TODOS os registros
  const { data: areas, isLoading: loadingAreas } = useQuery({
    queryKey: ["resumos-areas"],
    queryFn: async () => {
      let allData: any[] = [];
      let offset = 0;
      const batchSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from("RESUMO")
          .select("area")
          .not("area", "is", null)
          .range(offset, offset + batchSize - 1);

        if (error) {
          console.error("Erro ao buscar áreas:", error);
          throw error;
        }

        if (data && data.length > 0) {
          allData = [...allData, ...data];
          offset += batchSize;
          hasMore = data.length === batchSize;
        } else {
          hasMore = false;
        }
      }

      const areaMap = new Map<string, number>();
      allData.forEach((item) => {
        if (item.area) {
          areaMap.set(item.area, (areaMap.get(item.area) || 0) + 1);
        }
      });

      const areasArray = Array.from(areaMap.entries())
        .map(([area, count]) => ({ area, count }))
        .sort((a, b) => a.area.localeCompare(b.area));
      
      return areasArray;
    },
  });

  // Buscar temas da área selecionada - COM PAGINAÇÃO
  const { data: temas, isLoading: loadingTemas } = useQuery({
    queryKey: ["resumos-temas", areaSelecionada],
    queryFn: async () => {
      if (!areaSelecionada) return [];

      let allData: any[] = [];
      let offset = 0;
      const batchSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from("RESUMO")
          .select("tema, \"ordem Tema\"")
          .eq("area", areaSelecionada)
          .not("tema", "is", null)
          .range(offset, offset + batchSize - 1);

        if (error) throw error;

        if (data && data.length > 0) {
          allData = [...allData, ...data];
          offset += batchSize;
          hasMore = data.length === batchSize;
        } else {
          hasMore = false;
        }
      }

      const temaMap = new Map<string, { tema: string; ordem: string; count: number }>();
      allData.forEach((item: any) => {
        if (item.tema) {
          const existing = temaMap.get(item.tema);
          if (existing) {
            existing.count++;
          } else {
            temaMap.set(item.tema, {
              tema: item.tema,
              ordem: item["ordem Tema"] || "0",
              count: 1,
            });
          }
        }
      });

      return Array.from(temaMap.values()).sort((a, b) => {
        const ordemA = parseFloat(a.ordem) || 0;
        const ordemB = parseFloat(b.ordem) || 0;
        return ordemA - ordemB;
      });
    },
    enabled: !!areaSelecionada,
  });

  const areasFiltradas = areas?.filter(a => 
    a.area.toLowerCase().includes(searchArea.toLowerCase())
  );

  const temasFiltrados = temas?.filter(t =>
    t.tema.toLowerCase().includes(searchTema.toLowerCase())
  );

  const totalResumos = areas?.reduce((acc, area) => acc + area.count, 0) || 0;

  if (!areaSelecionada) {
    return (
      <div className="min-h-screen">
        {/* Hero Section */}
        <section 
          data-animate="hero"
          className={`relative overflow-hidden bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 pt-20 pb-32 px-4 transition-all duration-1000 ${
            visibleElements.has('hero') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          {/* Efeito de brilho de fundo */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          
          <div className="relative max-w-4xl mx-auto text-center">
            {/* Ícone animado */}
            <div className="mb-6 inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-sm rounded-full animate-pulse">
              <BookOpen className="w-10 h-10 text-white" />
            </div>

            {/* Título */}
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
              Resumos Jurídicos
            </h1>
            
            {/* Pergunta principal */}
            <p className="text-xl md:text-2xl text-white/90 mb-8 font-light">
              O que você quer aprender hoje?
            </p>

            {/* Estatísticas */}
            <div className="flex items-center justify-center gap-8 mb-10 flex-wrap">
              <div className="text-center transform hover:scale-110 transition-transform duration-300">
                <div className="text-3xl font-bold text-white">{areas?.length || 0}</div>
                <div className="text-sm text-white/80">Áreas</div>
              </div>
              <div className="w-px h-12 bg-white/20" />
              <div className="text-center transform hover:scale-110 transition-transform duration-300">
                <div className="text-3xl font-bold text-white">{totalResumos}+</div>
                <div className="text-sm text-white/80">Resumos</div>
              </div>
              <div className="w-px h-12 bg-white/20" />
              <div className="text-center transform hover:scale-110 transition-transform duration-300">
                <div className="text-3xl font-bold text-white">2026</div>
                <div className="text-sm text-white/80">Atualizado</div>
              </div>
            </div>

            {/* CTA Button */}
            <Button
              size="lg"
              onClick={scrollToAreas}
              className="bg-white text-purple-900 hover:bg-white/90 font-semibold px-8 py-6 text-lg rounded-full shadow-2xl hover:shadow-white/20 hover:scale-105 transition-all duration-300"
            >
              Começar Agora
              <Sparkles className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </section>

        {/* Seção de Escolha de Área */}
        <section id="areas-section" className="py-16 px-4 bg-background">
          <div 
            data-animate="areas-title"
            className={`max-w-6xl mx-auto mb-12 text-center transition-all duration-1000 ${
              visibleElements.has('areas-title') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Escolha sua área de interesse
            </h2>
            <p className="text-muted-foreground text-lg">
              Selecione uma área do Direito para começar sua jornada de aprendizado
            </p>
          </div>

          {/* Barra de pesquisa */}
          <div 
            data-animate="search"
            className={`max-w-2xl mx-auto mb-12 transition-all duration-1000 delay-100 ${
              visibleElements.has('search') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
          >
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Pesquisar área do direito..."
                value={searchArea}
                onChange={(e) => setSearchArea(e.target.value)}
                className="pl-12 pr-4 h-14 text-lg rounded-full border-2 focus:border-purple-500 transition-all"
              />
            </div>
          </div>

          {/* Grid de Áreas */}
          <div className="max-w-6xl mx-auto pb-20">
            {loadingAreas ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton key={i} className="h-40 w-full rounded-2xl" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {areasFiltradas?.map((area, idx) => (
                  <div
                    key={area.area}
                    data-animate={`area-${idx}`}
                    className={`transition-all duration-700 ${
                      visibleElements.has(`area-${idx}`) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                    }`}
                    style={{ transitionDelay: `${idx * 100}ms` }}
                  >
                    <Card
                      className="group cursor-pointer hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-300 hover:scale-105 border-2 hover:border-purple-500 bg-gradient-to-br from-card to-card/80 h-full"
                      onClick={() => {
                        setAreaSelecionada(area.area);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                    >
                      <CardContent className="p-6 h-full flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between mb-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg">
                              <span className="text-2xl">📚</span>
                            </div>
                            <Badge variant="secondary" className="bg-purple-500/10 text-purple-700 dark:text-purple-300">
                              {area.count}
                            </Badge>
                          </div>
                          <h3 className="font-bold text-lg mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors line-clamp-2">
                            {area.area}
                          </h3>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {area.count} {area.count === 1 ? "resumo disponível" : "resumos disponíveis"}
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    );
  }

  // Tela de Seleção de Tema
  return (
    <div className="min-h-screen bg-background">
      {/* Header da área selecionada */}
      <div 
        data-animate="tema-header"
        className={`bg-gradient-to-r from-purple-900 to-blue-900 py-12 px-4 transition-all duration-1000 ${
          visibleElements.has('tema-header') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="max-w-6xl mx-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setAreaSelecionada(null)}
            className="mb-4 text-white hover:bg-white/10"
          >
            <ArrowLeft className="mr-2 w-4 h-4" />
            Trocar área
          </Button>
          
          <div className="flex items-center gap-3 mb-4">
            <Badge className="bg-white/20 text-white border-0 backdrop-blur-sm">
              Área selecionada
            </Badge>
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
            {areaSelecionada}
          </h1>
          
          <div className="flex items-center gap-2 text-white/90">
            <Target className="w-5 h-5" />
            <p className="text-lg">
              Ótima escolha! Agora selecione o tema que deseja estudar
            </p>
          </div>
        </div>
      </div>

      {/* Barra de pesquisa de temas */}
      <div className="py-8 px-4 bg-background border-b">
        <div 
          data-animate="tema-search"
          className={`max-w-2xl mx-auto transition-all duration-1000 ${
            visibleElements.has('tema-search') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Pesquisar tema..."
              value={searchTema}
              onChange={(e) => setSearchTema(e.target.value)}
              className="pl-12 pr-4 h-12 rounded-full border-2"
            />
          </div>
        </div>
      </div>

      {/* Lista de Temas */}
      <div className="py-12 px-4">
        <div className="max-w-6xl mx-auto pb-20">
          {loadingTemas ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-32 w-full rounded-2xl" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {temasFiltrados?.map((tema, idx) => (
                <div
                  key={tema.tema}
                  data-animate={`tema-${idx}`}
                  className={`transition-all duration-700 ${
                    visibleElements.has(`tema-${idx}`) ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'
                  }`}
                  style={{ transitionDelay: `${idx * 100}ms` }}
                >
                  <Card
                    className="group cursor-pointer hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300 hover:scale-[1.02] border-l-4 border-l-purple-500 hover:border-l-blue-500"
                    onClick={() =>
                      navigate(
                        `/resumos-juridicos/prontos/${encodeURIComponent(
                          areaSelecionada
                        )}/${encodeURIComponent(tema.tema)}`
                      )
                    }
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1">
                          {/* Número do tema */}
                          <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg group-hover:scale-110 transition-transform">
                            {idx + 1}
                          </div>
                          
                          {/* Conteúdo */}
                          <div className="flex-1">
                            <h3 className="font-bold text-lg mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                              {tema.tema}
                            </h3>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <BookOpen className="w-4 h-4" />
                                {tema.count} {tema.count === 1 ? "subtema" : "subtemas"}
                              </span>
                              <span className="flex items-center gap-1">
                                <TrendingUp className="w-4 h-4" />
                                Pronto para estudo
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Ícone */}
                        <div className="flex-shrink-0 text-3xl group-hover:scale-110 transition-transform">
                          📖
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResumosProntos;
