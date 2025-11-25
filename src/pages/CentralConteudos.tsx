import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layers, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { SmartLoadingIndicator } from "@/components/chat/SmartLoadingIndicator";

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
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header Elegante */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary via-primary to-primary/80 shadow-xl shadow-primary/20">
              <Layers className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Central de Conteúdos
              </h1>
              <p className="text-muted-foreground mt-1">
                Todo o conteúdo jurídico organizado por área
              </p>
            </div>
          </div>

          {/* Search Elegante */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Buscar área do direito..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-14 text-base bg-card/50 backdrop-blur-sm border-2 focus:border-primary/50 transition-colors"
            />
          </div>
        </div>

        {/* Grid de Áreas Elegante */}
        {filteredAreas.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredAreas.map((areaData) => {
              const cores = CORES_POR_AREA[areaData.area] || CORES_DEFAULT;
              return (
                <Card
                  key={areaData.area}
                  className="cursor-pointer hover:scale-[1.01] transition-all duration-300 bg-card/50 backdrop-blur-sm border-2 hover:border-primary/30 group relative overflow-hidden shadow-lg hover:shadow-xl"
                  onClick={() => navigate(`/central-conteudos/${encodeURIComponent(areaData.area)}`)}
                >
                  {/* Glow Gradient Top */}
                  <div
                    className="absolute top-0 left-0 right-0 h-1.5"
                    style={{
                      background: `linear-gradient(90deg, transparent, ${cores.glowColor}, transparent)`,
                      boxShadow: `0 0 30px ${cores.glowColor}90`
                    }}
                  />

                  <CardContent className="p-6">
                    <div className="flex items-center gap-5 mb-5">
                      <div
                        className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${cores.cor} flex items-center justify-center group-hover:scale-105 transition-transform shadow-xl flex-shrink-0`}
                        style={{ boxShadow: `0 8px 20px ${cores.glowColor}40` }}
                      >
                        <Layers className="w-10 h-10 text-white" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-bold text-foreground mb-1.5">
                          {areaData.area}
                        </h3>
                        <p className="text-muted-foreground text-base">
                          {areaData.total} {areaData.total === 1 ? "conteúdo" : "conteúdos"}
                        </p>
                      </div>
                    </div>

                    {/* Badges Elegantes com Ícones */}
                    <div className="flex flex-wrap gap-2.5">
                      {areaData.videoaulas > 0 && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20">
                          <svg className="w-4 h-4 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M23 7l-7 5 7 5V7z" />
                            <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                          </svg>
                          <span className="text-sm font-medium text-red-500">{areaData.videoaulas}</span>
                        </div>
                      )}
                      {areaData.biblioteca > 0 && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
                          <svg className="w-4 h-4 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                          </svg>
                          <span className="text-sm font-medium text-blue-500">{areaData.biblioteca}</span>
                        </div>
                      )}
                      {areaData.flashcards > 0 && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                          <svg className="w-4 h-4 text-yellow-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                          </svg>
                          <span className="text-sm font-medium text-yellow-500">{areaData.flashcards}</span>
                        </div>
                      )}
                      {areaData.mapaMental > 0 && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20">
                          <svg className="w-4 h-4 text-purple-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5" />
                            <path d="M8.5 8.5v.01" />
                            <path d="M16 15.5v.01" />
                            <path d="M12 12v.01" />
                            <path d="M11 17v.01" />
                            <path d="M7 14v.01" />
                          </svg>
                          <span className="text-sm font-medium text-purple-500">{areaData.mapaMental}</span>
                        </div>
                      )}
                      {areaData.cursos > 0 && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20">
                          <svg className="w-4 h-4 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                          </svg>
                          <span className="text-sm font-medium text-green-500">{areaData.cursos}</span>
                        </div>
                      )}
                      {areaData.resumos > 0 && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20">
                          <svg className="w-4 h-4 text-orange-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <path d="M14 2v6h6" />
                            <line x1="16" y1="13" x2="8" y2="13" />
                            <line x1="16" y1="17" x2="8" y2="17" />
                            <line x1="10" y1="9" x2="8" y2="9" />
                          </svg>
                          <span className="text-sm font-medium text-orange-500">{areaData.resumos}</span>
                        </div>
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
