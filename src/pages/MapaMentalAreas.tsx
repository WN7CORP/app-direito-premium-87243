import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Brain, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { SmartLoadingIndicator } from "@/components/chat/SmartLoadingIndicator";

interface AreaData {
  area: string;
  count: number;
}

const CORES_AREAS = [
  { cor: "from-red-500 to-red-700", bordaCor: "border-red-500/30", glowColor: "rgb(239, 68, 68)" },
  { cor: "from-blue-500 to-blue-700", bordaCor: "border-blue-500/30", glowColor: "rgb(59, 130, 246)" },
  { cor: "from-green-500 to-green-700", bordaCor: "border-green-500/30", glowColor: "rgb(34, 197, 94)" },
  { cor: "from-purple-500 to-purple-700", bordaCor: "border-purple-500/30", glowColor: "rgb(168, 85, 247)" },
  { cor: "from-yellow-500 to-yellow-700", bordaCor: "border-yellow-500/30", glowColor: "rgb(234, 179, 8)" },
  { cor: "from-pink-500 to-pink-700", bordaCor: "border-pink-500/30", glowColor: "rgb(236, 72, 153)" },
  { cor: "from-indigo-500 to-indigo-700", bordaCor: "border-indigo-500/30", glowColor: "rgb(99, 102, 241)" },
  { cor: "from-orange-500 to-orange-700", bordaCor: "border-orange-500/30", glowColor: "rgb(249, 115, 22)" },
  { cor: "from-teal-500 to-teal-700", bordaCor: "border-teal-500/30", glowColor: "rgb(20, 184, 166)" },
  { cor: "from-cyan-500 to-cyan-700", bordaCor: "border-cyan-500/30", glowColor: "rgb(6, 182, 212)" },
];

export default function MapaMentalAreas() {
  const navigate = useNavigate();
  const [areas, setAreas] = useState<AreaData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAreas();
  }, []);

  const fetchAreas = async () => {
    try {
      const { data, error } = await supabase
        .from('MAPA MENTAL' as any)
        .select('area');

      if (error) throw error;

      // Agrupar por área e contar temas
      const areaMap = new Map<string, number>();
      data?.forEach((item: any) => {
        const area = item.area;
        if (area) {
          areaMap.set(area, (areaMap.get(area) || 0) + 1);
        }
      });

      // Criar array de áreas únicas com contagem, ordenado alfabeticamente
      const areasUnicas = Array.from(areaMap.entries())
        .map(([area, count]) => ({ area, count }))
        .sort((a, b) => a.area.localeCompare(b.area, 'pt-BR'));

      setAreas(areasUnicas);
    } catch (error) {
      console.error('Erro ao buscar áreas:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-card to-background pb-20">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <SmartLoadingIndicator nome="Áreas do Mapa Mental" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background pb-20">
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/aprender")}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 w-4 h-4" />
            Voltar
          </Button>

          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-violet-600 shadow-lg shadow-violet-500/50">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Mapa Mental</h1>
              <p className="text-sm md:text-base text-muted-foreground">
                Escolha a área do direito
              </p>
            </div>
          </div>
        </div>

        {/* Grid de áreas */}
        {areas.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {areas.map((areaData, index) => {
              const cores = CORES_AREAS[index % CORES_AREAS.length];
              return (
                <Card
                  key={areaData.area}
                  className={`cursor-pointer hover:scale-105 transition-all bg-card ${cores.bordaCor} border-2 group relative overflow-hidden`}
                  onClick={() => navigate(`/mapa-mental/area/${encodeURIComponent(areaData.area)}`)}
                >
                  {/* Brilho no topo */}
                  <div 
                    className="absolute top-0 left-0 right-0 h-1 opacity-80"
                    style={{
                      background: `linear-gradient(90deg, transparent, ${cores.glowColor}, transparent)`,
                      boxShadow: `0 0 20px ${cores.glowColor}`
                    }}
                  />

                  <CardContent className="p-6">
                    <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${cores.cor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                      <Brain className="w-8 h-8 text-white" />
                    </div>

                    <h3 className="text-lg font-bold text-foreground mb-2">
                      {areaData.area}
                    </h3>
                    
                    <p className="text-muted-foreground text-sm">
                      {areaData.count} {areaData.count === 1 ? 'mapa' : 'mapas'}
                    </p>
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
