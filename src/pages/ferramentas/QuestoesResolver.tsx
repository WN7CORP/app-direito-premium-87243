import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Scale, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import QuestoesConcurso from "@/components/QuestoesConcurso";

export interface Questao {
  id: number;
  enunciado: string;
  alternativa_a: string;
  alternativa_b: string;
  alternativa_c: string;
  alternativa_d: string;
  resposta_correta: string;
  comentario: string;
  subtema: string;
}

const QuestoesResolver = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const area = searchParams.get("area") || "";
  const tema = searchParams.get("tema") || "";
  const [isGenerating, setIsGenerating] = useState(false);
  const [questoes, setQuestoes] = useState<Questao[]>([]);

  const { data: questoesCache, isLoading, refetch } = useQuery({
    queryKey: ["questoes-resolver", area, tema],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("QUESTOES_GERADAS")
        .select("*")
        .eq("area", area)
        .eq("tema", tema);

      if (error) throw error;
      return data as Questao[];
    },
    enabled: !!area && !!tema
  });

  useEffect(() => {
    if (questoesCache && questoesCache.length > 0) {
      setQuestoes(questoesCache);
    } else if (questoesCache && questoesCache.length === 0 && !isGenerating) {
      generateQuestoes();
    }
  }, [questoesCache]);

  const generateQuestoes = async () => {
    setIsGenerating(true);
    try {
      // Busca resumos do tema
      const { data: resumos, error: resumosError } = await supabase
        .from("RESUMO")
        .select("subtema, conteudo")
        .eq("area", area)
        .eq("tema", tema);

      if (resumosError) throw resumosError;

      if (!resumos || resumos.length === 0) {
        toast.error("Não há conteúdo disponível para gerar questões");
        setIsGenerating(false);
        return;
      }

      // Chama edge function para gerar questões
      const { data, error } = await supabase.functions.invoke("gerar-questoes-tema", {
        body: { area, tema, resumos }
      });

      if (error) throw error;

      if (data?.questoes && data.questoes.length > 0) {
        setQuestoes(data.questoes);
        toast.success(`${data.questoes.length} questões geradas!`);
      } else {
        toast.error("Não foi possível gerar questões");
      }
    } catch (error) {
      console.error("Erro ao gerar questões:", error);
      toast.error("Erro ao gerar questões. Tente novamente.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFinish = () => {
    navigate(`/ferramentas/questoes/temas?area=${encodeURIComponent(area)}`);
  };

  if (isLoading || isGenerating) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
          <div className="text-center">
            <h2 className="text-lg font-semibold mb-1">
              {isGenerating ? "Gerando questões..." : "Carregando..."}
            </h2>
            <p className="text-sm text-muted-foreground max-w-xs">
              {isGenerating 
                ? "A IA está criando questões personalizadas para você. Isso pode levar alguns segundos."
                : "Verificando questões disponíveis..."
              }
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (questoes.length === 0) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-destructive/20 to-destructive/10 flex items-center justify-center">
            <Scale className="w-8 h-8 text-destructive" />
          </div>
          <div className="text-center">
            <h2 className="text-lg font-semibold mb-1">Nenhuma questão disponível</h2>
            <p className="text-sm text-muted-foreground max-w-xs mb-4">
              Não foi possível carregar ou gerar questões para este tema.
            </p>
            <Button onClick={() => navigate(-1)}>Voltar</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b px-3 py-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-sm line-clamp-1">{tema}</h1>
            <p className="text-xs text-muted-foreground line-clamp-1">{area}</p>
          </div>
        </div>
      </div>

      {/* Quiz */}
      <QuestoesConcurso 
        questoes={questoes} 
        onFinish={handleFinish}
        area={area}
        tema={tema}
      />
    </div>
  );
};

export default QuestoesResolver;
