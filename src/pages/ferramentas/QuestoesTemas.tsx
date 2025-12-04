import { useNavigate, useSearchParams } from "react-router-dom";
import { Scale, Search, CheckCircle2, Clock, RefreshCw, ArrowDownAZ, ListOrdered } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const QuestoesTemas = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const area = searchParams.get("area") || "";
  const [searchTerm, setSearchTerm] = useState("");
  const [ordenacao, setOrdenacao] = useState<"cronologica" | "alfabetica">("cronologica");

  // Função para normalizar strings de forma consistente (remove acentos também)
  const normalizar = (str: string) => 
    str.trim()
       .toLowerCase()
       .normalize('NFD')
       .replace(/[\u0300-\u036f]/g, '') // Remove acentos
       .replace(/\s+/g, ' ');

  const { data: temas, isLoading, isFetching } = useQuery({
    queryKey: ["questoes-temas", area],
    queryFn: async () => {
      // Busca temas e subtemas únicos da área, ordenados pelo id (ordem cronológica)
      const { data: resumoData, error } = await supabase
        .from("RESUMO")
        .select("id, tema, subtema")
        .eq("area", area)
        .not("tema", "is", null)
        .order("id", { ascending: true });

      if (error) throw error;

      // Agrupa subtemas por tema e preserva a ordem de aparição
      const subtemasPortema: Record<string, { nomeOriginal: string; subtemas: Set<string>; ordem: number }> = {};
      let ordemCounter = 0;
      resumoData?.forEach(r => {
        if (r.tema) {
          const temaNorm = normalizar(r.tema);
          if (!subtemasPortema[temaNorm]) {
            subtemasPortema[temaNorm] = { nomeOriginal: r.tema.trim(), subtemas: new Set(), ordem: ordemCounter++ };
          }
          if (r.subtema) {
            subtemasPortema[temaNorm].subtemas.add(normalizar(r.subtema));
          }
        }
      });

      // Busca todas as questões geradas com paginação completa
      let allQuestoesData: { tema: string | null; subtema: string | null }[] = [];
      let offset = 0;
      const pageSize = 1000;
      let hasMore = true;
      
      while (hasMore) {
        const { data: pageData } = await supabase
          .from("QUESTOES_GERADAS")
          .select("tema, subtema")
          .eq("area", area)
          .range(offset, offset + pageSize - 1);
        
        if (pageData && pageData.length > 0) {
          allQuestoesData = [...allQuestoesData, ...pageData];
          offset += pageSize;
          hasMore = pageData.length === pageSize;
        } else {
          hasMore = false;
        }
      }

      // Agrupa subtemas com questões por tema e conta total de questões (usando chave normalizada)
      const subtemasComQuestoes: Record<string, Set<string>> = {};
      const totalQuestoesPortema: Record<string, number> = {};
      allQuestoesData?.forEach(q => {
        if (q.tema) {
          const temaNorm = normalizar(q.tema);
          if (!subtemasComQuestoes[temaNorm]) {
            subtemasComQuestoes[temaNorm] = new Set();
          }
          if (!totalQuestoesPortema[temaNorm]) {
            totalQuestoesPortema[temaNorm] = 0;
          }
          totalQuestoesPortema[temaNorm]++;
          if (q.subtema) {
            subtemasComQuestoes[temaNorm].add(normalizar(q.subtema));
          }
        }
      });

      return Object.entries(subtemasPortema).map(([temaNorm, { nomeOriginal, subtemas, ordem }]) => {
        const totalSubtemas = subtemas.size;
        // Usa o tamanho do Set de questões geradas diretamente
        const questoesDoTema = subtemasComQuestoes[temaNorm] || new Set();
        const subtemasGerados = questoesDoTema.size;
        const totalQuestoes = totalQuestoesPortema[temaNorm] || 0;
        
        // Completo se todos os subtemas do RESUMO foram gerados
        const temTodosSubtemas = totalSubtemas > 0 && subtemasGerados >= totalSubtemas;
        const temAlgunsSubtemas = subtemasGerados > 0 && subtemasGerados < totalSubtemas;
        const progressoPercent = totalSubtemas > 0 ? Math.round((subtemasGerados / totalSubtemas) * 100) : 0;
        
        return {
          tema: nomeOriginal,
          temQuestoes: temTodosSubtemas,
          parcial: temAlgunsSubtemas,
          subtemasGerados,
          totalSubtemas,
          totalQuestoes,
          progressoPercent,
          ordem
        };
      }).sort((a, b) => a.ordem - b.ordem);
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
  ).sort((a, b) => 
    ordenacao === "alfabetica" 
      ? a.tema.localeCompare(b.tema) 
      : a.ordem - b.ordem
  );

  const temPendentes = temas?.some(t => !t.temQuestoes);

  return (
    <div className="flex flex-col min-h-screen bg-background pb-6">
      <div className="flex-1 px-3 md:px-6 py-4 md:py-6 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
              <Scale className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold line-clamp-1">{area}</h1>
              <p className="text-sm text-muted-foreground">
                {temas ? `${temas.reduce((acc, t) => acc + t.totalQuestoes, 0)} questões disponíveis` : 'Carregando...'}
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

        {/* Toggle de ordenação */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Ordenar:</span>
          <ToggleGroup 
            type="single" 
            value={ordenacao} 
            onValueChange={(value) => value && setOrdenacao(value as "cronologica" | "alfabetica")}
            className="bg-muted/50 rounded-lg p-1"
          >
            <ToggleGroupItem 
              value="cronologica" 
              aria-label="Ordem cronológica"
              className="text-xs px-3 py-1.5 h-auto data-[state=on]:bg-background data-[state=on]:shadow-sm"
            >
              <ListOrdered className="w-3.5 h-3.5 mr-1.5" />
              Cronológica
            </ToggleGroupItem>
            <ToggleGroupItem 
              value="alfabetica" 
              aria-label="Ordem alfabética"
              className="text-xs px-3 py-1.5 h-auto data-[state=on]:bg-background data-[state=on]:shadow-sm"
            >
              <ArrowDownAZ className="w-3.5 h-3.5 mr-1.5" />
              Alfabética
            </ToggleGroupItem>
          </ToggleGroup>
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
                        ? `${item.totalQuestoes} questões disponíveis` 
                        : item.parcial 
                        ? `${item.subtemasGerados}/${item.totalSubtemas} subtemas gerados`
                        : `0/${item.totalSubtemas} subtemas`}
                    </p>
                  </div>
                </div>
                
                {/* Barra de progresso só aparece durante geração (parcial) */}
                {item.parcial && (
                  <div className="w-full">
                    <Progress 
                      value={item.progressoPercent} 
                      className="h-1.5 transition-all duration-500 [&>div]:bg-blue-500"
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
