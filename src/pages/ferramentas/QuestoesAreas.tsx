import { useNavigate } from "react-router-dom";
import { ArrowLeft, Scale, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

const QuestoesAreas = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: areas, isLoading } = useQuery({
    queryKey: ["questoes-areas"],
    queryFn: async () => {
      // Busca paginada para trazer TODOS os registros
      const pageSize = 1000;
      let allData: { area: string; tema: string }[] = [];
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

        allData = [...allData, ...data];
        if (data.length < pageSize) break;
        page++;
      }

      // Agrupa por área e conta temas únicos
      const areasMap = new Map<string, Set<string>>();

      allData.forEach((item) => {
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
        }))
        .sort((a, b) => a.area.localeCompare(b.area));
    },
  });

  const filteredAreas = areas?.filter((item) =>
    item.area.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const areaColors = [
    "from-blue-500/20 to-blue-600/10 border-blue-500/30",
    "from-purple-500/20 to-purple-600/10 border-purple-500/30",
    "from-emerald-500/20 to-emerald-600/10 border-emerald-500/30",
    "from-orange-500/20 to-orange-600/10 border-orange-500/30",
    "from-rose-500/20 to-rose-600/10 border-rose-500/30",
    "from-cyan-500/20 to-cyan-600/10 border-cyan-500/30",
    "from-amber-500/20 to-amber-600/10 border-amber-500/30",
    "from-indigo-500/20 to-indigo-600/10 border-indigo-500/30",
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background pb-6">
      <div className="flex-1 px-3 md:px-6 py-4 md:py-6 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/ferramentas")}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
              <Scale className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Questões por Tema</h1>
              <p className="text-sm text-muted-foreground">
                Escolha uma área do direito
              </p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar área..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Lista de Áreas */}
        <div className="grid grid-cols-2 gap-3">
          {isLoading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))
          ) : filteredAreas?.length === 0 ? (
            <div className="col-span-2 text-center py-8 text-muted-foreground">
              Nenhuma área encontrada
            </div>
          ) : (
            filteredAreas?.map((item, index) => (
              <button
                key={item.area}
                onClick={() =>
                  navigate(
                    `/ferramentas/questoes/temas?area=${encodeURIComponent(item.area)}`
                  )
                }
                className={`relative overflow-hidden rounded-xl border p-4 text-left transition-all hover:scale-[1.02] active:scale-[0.98] bg-gradient-to-br ${areaColors[index % areaColors.length]}`}
              >
                <Scale className="w-5 h-5 text-primary mb-2" />
                <h3 className="font-semibold text-sm line-clamp-2 mb-1">
                  {item.area}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {item.totalTemas} {item.totalTemas === 1 ? "tema" : "temas"}
                </p>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default QuestoesAreas;
