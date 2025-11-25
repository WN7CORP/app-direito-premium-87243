import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layers, Search, BookOpen, Video, Zap, Brain, BookMarked, ScrollText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { SmartLoadingIndicator } from "@/components/chat/SmartLoadingIndicator";
import { Badge } from "@/components/ui/badge";

interface AreaConteudos {
  area: string;
  videoaulas: number;
  biblioteca: number;
  flashcards: number;
  mapaMental: number;
  cursos: number;
  resumos: number;
  total: number;
}

const CORES_POR_AREA: Record<string, { cor: string; bordaCor: string; glowColor: string }> = {
  "DIREITO CIVIL": {
    cor: "from-red-500 to-red-700",
    bordaCor: "border-red-500/30",
    glowColor: "rgb(239, 68, 68)"
  },
  "DIREITO CONSTITUCIONAL": {
    cor: "from-blue-500 to-blue-700",
    bordaCor: "border-blue-500/30",
    glowColor: "rgb(59, 130, 246)"
  },
  "DIREITO EMPRESARIAL": {
    cor: "from-green-500 to-green-700",
    bordaCor: "border-green-500/30",
    glowColor: "rgb(34, 197, 94)"
  },
  "DIREITO PENAL": {
    cor: "from-purple-500 to-purple-700",
    bordaCor: "border-purple-500/30",
    glowColor: "rgb(168, 85, 247)"
  },
  "DIREITO TRIBUTÁRIO": {
    cor: "from-yellow-500 to-yellow-700",
    bordaCor: "border-yellow-500/30",
    glowColor: "rgb(234, 179, 8)"
  },
  "DIREITO ADMINISTRATIVO": {
    cor: "from-indigo-500 to-indigo-700",
    bordaCor: "border-indigo-500/30",
    glowColor: "rgb(99, 102, 241)"
  },
  "DIREITO TRABALHISTA": {
    cor: "from-orange-500 to-orange-700",
    bordaCor: "border-orange-500/30",
    glowColor: "rgb(249, 115, 22)"
  },
  "DIREITO PROCESSUAL CIVIL": {
    cor: "from-cyan-500 to-cyan-700",
    bordaCor: "border-cyan-500/30",
    glowColor: "rgb(6, 182, 212)"
  },
  "DIREITO PROCESSUAL PENAL": {
    cor: "from-pink-500 to-pink-700",
    bordaCor: "border-pink-500/30",
    glowColor: "rgb(236, 72, 153)"
  }
};

const CORES_DEFAULT = {
  cor: "from-violet-500 to-violet-700",
  bordaCor: "border-violet-500/30",
  glowColor: "rgb(124, 58, 237)"
};

const normalizeArea = (area: string): string => {
  return area
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
};

export default function CentralConteudos() {
  const navigate = useNavigate();
  const [areas, setAreas] = useState<AreaConteudos[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchAllAreas();
  }, []);

  const fetchAllAreas = async () => {
    try {
      // Buscar de todas as fontes em paralelo
      const [videoaulasData, bibliotecaData, flashcardsData, mapaData, cursosData, resumosData] = await Promise.all([
        supabase.from("VIDEO AULAS-NOVO" as any).select("area"),
        supabase.from("BIBLIOTECA-ESTUDOS" as any).select("Área"),
        supabase.rpc("get_flashcard_areas"),
        supabase.from("MAPA MENTAL" as any).select("area"),
        supabase.from("CURSOS-APP" as any).select("area"),
        supabase.from("RESUMO" as any).select("area")
      ]);

      // Consolidar todas as áreas
      const areaMap = new Map<string, AreaConteudos>();

      // Processar videoaulas
      videoaulasData.data?.forEach((item: any) => {
        const area = normalizeArea(item.area || "");
        if (!area) return;
        const current = areaMap.get(area) || { area, videoaulas: 0, biblioteca: 0, flashcards: 0, mapaMental: 0, cursos: 0, resumos: 0, total: 0 };
        current.videoaulas++;
        current.total++;
        areaMap.set(area, current);
      });

      // Processar biblioteca
      bibliotecaData.data?.forEach((item: any) => {
        const area = normalizeArea(item["Área"] || "");
        if (!area) return;
        const current = areaMap.get(area) || { area, videoaulas: 0, biblioteca: 0, flashcards: 0, mapaMental: 0, cursos: 0, resumos: 0, total: 0 };
        current.biblioteca++;
        current.total++;
        areaMap.set(area, current);
      });

      // Processar flashcards
      flashcardsData.data?.forEach((item: any) => {
        const area = normalizeArea(item.area || "");
        if (!area) return;
        const current = areaMap.get(area) || { area, videoaulas: 0, biblioteca: 0, flashcards: 0, mapaMental: 0, cursos: 0, resumos: 0, total: 0 };
        current.flashcards += item.total_questoes || 0;
        current.total += item.total_questoes || 0;
        areaMap.set(area, current);
      });

      // Processar mapa mental
      mapaData.data?.forEach((item: any) => {
        const area = normalizeArea(item.area || "");
        if (!area) return;
        const current = areaMap.get(area) || { area, videoaulas: 0, biblioteca: 0, flashcards: 0, mapaMental: 0, cursos: 0, resumos: 0, total: 0 };
        current.mapaMental++;
        current.total++;
        areaMap.set(area, current);
      });

      // Processar cursos
      cursosData.data?.forEach((item: any) => {
        const area = normalizeArea(item.area || "");
        if (!area) return;
        const current = areaMap.get(area) || { area, videoaulas: 0, biblioteca: 0, flashcards: 0, mapaMental: 0, cursos: 0, resumos: 0, total: 0 };
        current.cursos++;
        current.total++;
        areaMap.set(area, current);
      });

      // Processar resumos
      resumosData.data?.forEach((item: any) => {
        const area = normalizeArea(item.area || "");
        if (!area) return;
        const current = areaMap.get(area) || { area, videoaulas: 0, biblioteca: 0, flashcards: 0, mapaMental: 0, cursos: 0, resumos: 0, total: 0 };
        current.resumos++;
        current.total++;
        areaMap.set(area, current);
      });

      // Converter para array e ordenar
      const areasArray = Array.from(areaMap.values())
        .sort((a, b) => a.area.localeCompare(b.area, "pt-BR"));

      setAreas(areasArray);
    } catch (error) {
      console.error("Erro ao buscar áreas:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAreas = areas.filter(area =>
    area.area.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-card to-background pb-20">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <SmartLoadingIndicator nome="Central de Conteúdos" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background pb-20">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/80 shadow-lg">
              <Layers className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Central de Conteúdos</h1>
              <p className="text-sm md:text-base text-muted-foreground">
                Todo o conteúdo jurídico organizado por área
              </p>
            </div>
          </div>

          {/* Search */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar área do direito..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Grid de Áreas */}
        {filteredAreas.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAreas.map((areaData) => {
              const cores = CORES_POR_AREA[areaData.area] || CORES_DEFAULT;
              return (
                <Card
                  key={areaData.area}
                  className={`cursor-pointer hover:scale-[1.02] transition-all bg-card ${cores.bordaCor} border-2 group relative overflow-hidden`}
                  onClick={() => navigate(`/central-conteudos/${encodeURIComponent(areaData.area)}`)}
                >
                  {/* Glow no topo */}
                  <div
                    className="absolute top-0 left-0 right-0 h-1 opacity-80"
                    style={{
                      background: `linear-gradient(90deg, transparent, ${cores.glowColor}, transparent)`,
                      boxShadow: `0 0 20px ${cores.glowColor}`
                    }}
                  />

                  <CardContent className="p-5">
                    <div className="flex items-start gap-4 mb-4">
                      <div
                        className={`w-14 h-14 rounded-full bg-gradient-to-br ${cores.cor} flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg flex-shrink-0`}
                      >
                        <Layers className="w-7 h-7 text-white" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-bold text-foreground mb-1">
                          {areaData.area}
                        </h3>
                        <p className="text-muted-foreground text-sm">
                          {areaData.total} {areaData.total === 1 ? "conteúdo" : "conteúdos"}
                        </p>
                      </div>
                    </div>

                    {/* Badges de conteúdos */}
                    <div className="flex flex-wrap gap-2">
                      {areaData.videoaulas > 0 && (
                        <Badge variant="secondary" className="text-xs gap-1">
                          <Video className="w-3 h-3" />
                          {areaData.videoaulas}
                        </Badge>
                      )}
                      {areaData.biblioteca > 0 && (
                        <Badge variant="secondary" className="text-xs gap-1">
                          <BookOpen className="w-3 h-3" />
                          {areaData.biblioteca}
                        </Badge>
                      )}
                      {areaData.flashcards > 0 && (
                        <Badge variant="secondary" className="text-xs gap-1">
                          <Zap className="w-3 h-3" />
                          {areaData.flashcards}
                        </Badge>
                      )}
                      {areaData.mapaMental > 0 && (
                        <Badge variant="secondary" className="text-xs gap-1">
                          <Brain className="w-3 h-3" />
                          {areaData.mapaMental}
                        </Badge>
                      )}
                      {areaData.cursos > 0 && (
                        <Badge variant="secondary" className="text-xs gap-1">
                          <BookMarked className="w-3 h-3" />
                          {areaData.cursos}
                        </Badge>
                      )}
                      {areaData.resumos > 0 && (
                        <Badge variant="secondary" className="text-xs gap-1">
                          <ScrollText className="w-3 h-3" />
                          {areaData.resumos}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Nenhuma área encontrada.</p>
          </div>
        )}
      </div>
    </div>
  );
}
