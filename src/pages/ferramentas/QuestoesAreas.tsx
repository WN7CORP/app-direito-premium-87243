import { useNavigate } from "react-router-dom";
import { ArrowLeft, Scale, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

const QuestoesAreas = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: areas, isLoading } = useQuery({
    queryKey: ["questoes-areas-com-contagem"],
    queryFn: async () => {
      // Fetch areas and temas from RESUMO
      const pageSize = 1000;
      let allResumoData: { area: string; tema: string }[] = [];
      let page = 0;

      while (true) {
        const { data, error } = await supabase
          .from("RESUMO")
          .select("area, tema")
          .not("area", "is", null)
          .not("tema", "is", null)
          .range(page * pageSize, (page + 1) * pageSize - 1);

        if (error) throw error;
        if (!data || data.length === 0) break;

        allResumoData = [...allResumoData, ...data];
        if (data.length < pageSize) break;
        page++;
      }

      // Fetch question counts from QUESTOES_GERADAS
      let allQuestoesData: { area: string | null }[] = [];
      let offset = 0;
      let hasMore = true;
      
      while (hasMore) {
        const { data: pageData } = await supabase
          .from("QUESTOES_GERADAS")
          .select("area")
          .range(offset, offset + pageSize - 1);
        
        if (pageData && pageData.length > 0) {
          allQuestoesData = [...allQuestoesData, ...pageData];
          offset += pageSize;
          hasMore = pageData.length === pageSize;
        } else {
          hasMore = false;
        }
      }

      // Count questions per area
      const questoesPortArea: Record<string, number> = {};
      allQuestoesData.forEach(q => {
        if (q.area) {
          questoesPortArea[q.area] = (questoesPortArea[q.area] || 0) + 1;
        }
      });

      // Group temas by area
      const areasMap = new Map<string, Set<string>>();

      allResumoData.forEach((item) => {
        if (item.area && item.tema) {
          if (!areasMap.has(item.area)) {
            areasMap.set(item.area, new Set());
          }
          areasMap.get(item.area)!.add(item.tema);
        }
      });

      return Array.from(areasMap.entries())
        .map(([area, temas]) => ({
          area,
          totalTemas: temas.size,
          totalQuestoes: questoesPortArea[area] || 0,
        }))
        .sort((a, b) => a.area.localeCompare(b.area));
    },
  });

  const filteredAreas = areas?.filter((item) =>
    item.area.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalQuestoes = areas?.reduce((acc, item) => acc + item.totalQuestoes, 0) || 0;

  const areaIcons = ["📜", "⚖️", "💼", "💰", "🏛️", "📋"];
  const glowColors = [
    "rgb(139, 92, 246)",
    "rgb(239, 68, 68)",
    "rgb(16, 185, 129)",
    "rgb(245, 158, 11)",
    "rgb(59, 130, 246)",
    "rgb(236, 72, 153)",
  ];

  return (
    <div className="px-3 py-4 max-w-4xl mx-auto pb-24">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/ferramentas")}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-purple-600 shadow-lg shadow-purple-500/50">
            <Scale className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold">Questões por Tema</h1>
            <p className="text-sm text-muted-foreground">
              {isLoading ? 'Carregando...' : `${totalQuestoes.toLocaleString('pt-BR')} questões disponíveis`}
            </p>
          </div>
        </div>
      </div>

      {/* Campo de Busca */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex gap-2">
            <Input
              placeholder="Buscar área..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-base"
            />
            <Button variant="outline" size="icon" className="shrink-0">
              <Search className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Áreas de Questões */}
      <div className="mb-6">
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
          <Scale className="w-5 h-5" />
          Áreas Disponíveis
        </h2>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-[140px] w-full rounded-lg" />
            ))}
          </div>
        ) : filteredAreas?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma área encontrada
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredAreas?.map((item, index) => (
              <Card
                key={item.area}
                className="cursor-pointer hover:scale-105 hover:shadow-xl hover:-translate-y-1 transition-all border-2 border-transparent hover:border-primary/50 bg-gradient-to-br from-card to-card/80 group overflow-hidden relative animate-fade-in"
                onClick={() =>
                  navigate(
                    `/ferramentas/questoes/temas?area=${encodeURIComponent(item.area)}`
                  )
                }
              >
                <div
                  className="absolute top-0 left-0 right-0 h-1 opacity-80"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${glowColors[index % glowColors.length]}, transparent)`,
                    boxShadow: `0 0 20px ${glowColors[index % glowColors.length]}`,
                  }}
                />

                <CardContent className="p-4 flex flex-col items-center text-center min-h-[140px] justify-center">
                  <div className="text-3xl mb-2">
                    {areaIcons[index % areaIcons.length]}
                  </div>
                  <h3 className="font-bold text-sm mb-1">{item.area}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {item.totalQuestoes.toLocaleString('pt-BR')} {item.totalQuestoes === 1 ? "questão" : "questões"}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestoesAreas;
