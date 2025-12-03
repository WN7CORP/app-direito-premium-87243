import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Scale, Search, CheckCircle2, Clock, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";

const QuestoesTemas = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const area = searchParams.get("area") || "";
  const [searchTerm, setSearchTerm] = useState("");

  // Função para normalizar strings de forma consistente
  const normalizar = (str: string) => str.trim().toLowerCase().replace(/\s+/g, ' ');

  const { data: temas, isLoading, isFetching } = useQuery({
    queryKey: ["questoes-temas", area],
    queryFn: async () => {
      // Busca temas e subtemas únicos da área
      const { data: resumoData, error } = await supabase
        .from("RESUMO")
        .select("tema, subtema")
        .eq("area", area)
        .not("tema", "is", null);

      if (error) throw error;

      // Agrupa subtemas por tema (usando chave normalizada, mas preservando nome original)
      const subtemasPortema: Record<string, { nomeOriginal: string; subtemas: Set<string> }> = {};
      resumoData?.forEach(r => {
        if (r.tema) {
          const temaNorm = normalizar(r.tema);
          if (!subtemasPortema[temaNorm]) {
            subtemasPortema[temaNorm] = { nomeOriginal: r.tema.trim(), subtemas: new Set() };
          }
          if (r.subtema) {
            subtemasPortema[temaNorm].subtemas.add(normalizar(r.subtema));
          }
        }
      });

      // Busca questões geradas com subtemas
      const { data: questoesData } = await supabase
        .from("QUESTOES_GERADAS")
        .select("tema, subtema")
        .eq("area", area);

      // Agrupa subtemas com questões por tema (usando chave normalizada)
      const subtemasComQuestoes: Record<string, Set<string>> = {};
      questoesData?.forEach(q => {
        if (q.tema) {
          const temaNorm = normalizar(q.tema);
          if (!subtemasComQuestoes[temaNorm]) {
            subtemasComQuestoes[temaNorm] = new Set();
          }
          if (q.subtema) {
            subtemasComQuestoes[temaNorm].add(normalizar(q.subtema));
          }
        }
      });

      return Object.entries(subtemasPortema).map(([temaNorm, { nomeOriginal, subtemas }]) => {
        const totalSubtemas = subtemas.size;
        // Conta quantos subtemas do RESUMO existem em QUESTOES_GERADAS
        const questoesDoTema = subtemasComQuestoes[temaNorm] || new Set();
        let subtemasGerados = 0;
        subtemas.forEach(sub => {
          if (questoesDoTema.has(sub)) {
            subtemasGerados++;
          }
        });
        
        const temTodosSubtemas = totalSubtemas > 0 && subtemasGerados >= totalSubtemas;
        const temAlgunsSubtemas = subtemasGerados > 0 && subtemasGerados < totalSubtemas;
        const progressoPercent = totalSubtemas > 0 ? Math.round((subtemasGerados / totalSubtemas) * 100) : 0;
        
        return {
          tema: nomeOriginal,
          temQuestoes: temTodosSubtemas,
          parcial: temAlgunsSubtemas,
          subtemasGerados,
          totalSubtemas,
          progressoPercent
        };
      }).sort((a, b) => a.tema.localeCompare(b.tema));
    },
    enabled: !!area,
    staleTime: 0,
    gcTime: 0, // Limpa cache ao desmontar
    refetchOnMount: 'always', // Sempre busca dados frescos ao montar
    refetchOnWindowFocus: true, // Recarrega ao voltar para a aba
    refetchInterval: (query) => {
      // Se há temas não completos, atualiza a cada 5 segundos
      const temPendentes = query.state.data?.some(t => !t.temQuestoes);
      return temPendentes ? 5000 : false;
    }
  });

  const filteredTemas = temas?.filter(item =>
    item.tema.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const temPendentes = temas?.some(t => !t.temQuestoes);

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
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
              <Scale className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold line-clamp-1">{area}</h1>
              <p className="text-sm text-muted-foreground">
                Escolha um tema para estudar
              </p>
            </div>
            {/* Indicador de atualização automática */}
            {temPendentes && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-full">
                <RefreshCw className={`w-3 h-3 ${isFetching ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Atualizando</span>
              </div>
            )}
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
              <Skeleton key={i} className="h-20 rounded-xl" />
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
                className="flex flex-col gap-2 p-4 rounded-xl border bg-card hover:bg-accent transition-all text-left"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors duration-500 ${
                    item.temQuestoes 
                      ? "bg-emerald-500/20 text-emerald-500" 
                      : item.parcial
                      ? "bg-blue-500/20 text-blue-500"
                      : "bg-amber-500/20 text-amber-500"
                  }`}>
                    {item.temQuestoes ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : item.parcial ? (
                      <RefreshCw className="w-5 h-5 animate-spin" />
                    ) : (
                      <Clock className="w-5 h-5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm line-clamp-1">{item.tema}</h3>
                    <p className="text-xs text-muted-foreground">
                      {item.temQuestoes 
                        ? "Questões prontas" 
                        : item.parcial 
                        ? `${item.subtemasGerados}/${item.totalSubtemas} subtemas gerados`
                        : `0/${item.totalSubtemas} subtemas`}
                    </p>
                  </div>
                </div>
                
                {/* Barra de progresso com animação suave */}
                {item.totalSubtemas > 0 && (
                  <div className="w-full">
                    <Progress 
                      value={item.progressoPercent} 
                      className={`h-1.5 transition-all duration-500 ${
                        item.temQuestoes 
                          ? "[&>div]:bg-emerald-500" 
                          : item.parcial 
                          ? "[&>div]:bg-blue-500" 
                          : "[&>div]:bg-amber-500/50"
                      }`}
                    />
                  </div>
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default QuestoesTemas;
