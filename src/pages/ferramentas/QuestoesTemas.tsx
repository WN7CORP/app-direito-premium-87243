import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Scale, Search, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

const QuestoesTemas = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const area = searchParams.get("area") || "";
  const [searchTerm, setSearchTerm] = useState("");

  const { data: temas, isLoading } = useQuery({
    queryKey: ["questoes-temas", area],
    queryFn: async () => {
      // Busca temas únicos da área
      const { data: resumoData, error } = await supabase
        .from("RESUMO")
        .select("tema")
        .eq("area", area)
        .not("tema", "is", null);

      if (error) throw error;

      const temasUnicos = [...new Set(resumoData?.map(r => r.tema).filter(Boolean))];

      // Verifica quais temas já têm questões geradas
      const { data: questoesData } = await supabase
        .from("QUESTOES_GERADAS")
        .select("tema")
        .eq("area", area);

      const temasComQuestoes = new Set(questoesData?.map(q => q.tema));

      return temasUnicos.map(tema => ({
        tema,
        temQuestoes: temasComQuestoes.has(tema)
      })).sort((a, b) => a.tema.localeCompare(b.tema));
    },
    enabled: !!area
  });

  const filteredTemas = temas?.filter(item =>
    item.tema.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col min-h-screen bg-background pb-6">
      <div className="flex-1 px-3 md:px-6 py-4 md:py-6 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/ferramentas/questoes")}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
              <Scale className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold line-clamp-1">{area}</h1>
              <p className="text-sm text-muted-foreground">
                Escolha um tema para estudar
              </p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar tema..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Lista de Temas */}
        <div className="grid grid-cols-1 gap-2">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))
          ) : filteredTemas?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum tema encontrado
            </div>
          ) : (
            filteredTemas?.map((item) => (
              <button
                key={item.tema}
                onClick={() => navigate(`/ferramentas/questoes/resolver?area=${encodeURIComponent(area)}&tema=${encodeURIComponent(item.tema)}`)}
                className="flex items-center gap-3 p-4 rounded-xl border bg-card hover:bg-accent transition-colors text-left"
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  item.temQuestoes 
                    ? "bg-emerald-500/20 text-emerald-500" 
                    : "bg-amber-500/20 text-amber-500"
                }`}>
                  {item.temQuestoes ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <Clock className="w-5 h-5" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-sm">{item.tema}</h3>
                  <p className="text-xs text-muted-foreground">
                    {item.temQuestoes ? "Questões prontas" : "Questões serão geradas"}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default QuestoesTemas;
