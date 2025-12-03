import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Scale } from "lucide-react";
import { FlashcardViewer } from "@/components/FlashcardViewer";
import { toast } from "sonner";

// Mapeamento de nome da tabela para nome da área nos flashcards
const getAreaName = (tableName: string): string => {
  const mapping: Record<string, string> = {
    "CP - Código Penal": "Código Penal",
    "CC - Código Civil": "Código Civil",
    "CF - Constituição Federal": "Constituição Federal",
    "CPC – Código de Processo Civil": "Código de Processo Civil",
    "CPP – Código de Processo Penal": "Código de Processo Penal",
    "CDC – Código de Defesa do Consumidor": "Código de Defesa do Consumidor",
    "CLT - Consolidação das Leis do Trabalho": "CLT",
    "CTN – Código Tributário Nacional": "Código Tributário Nacional",
    "CTB Código de Trânsito Brasileiro": "Código de Trânsito Brasileiro",
    "CE – Código Eleitoral": "Código Eleitoral",
    "CPM – Código Penal Militar": "Código Penal Militar",
    "CPPM – Código de Processo Penal Militar": "Código de Processo Penal Militar",
    "CA - Código de Águas": "Código de Águas",
    "CBA Código Brasileiro de Aeronáutica": "Código Brasileiro de Aeronáutica",
    "CBT Código Brasileiro de Telecomunicações": "Código de Telecomunicações",
    "CCOM – Código Comercial": "Código Comercial",
    "CDM – Código de Minas": "Código de Minas",
    "ESTATUTO - ECA": "ECA",
    "ESTATUTO - IDOSO": "Estatuto do Idoso",
    "ESTATUTO - OAB": "Estatuto da OAB",
    "ESTATUTO - PESSOA COM DEFICIÊNCIA": "Estatuto da Pessoa com Deficiência",
    "ESTATUTO - IGUALDADE RACIAL": "Estatuto da Igualdade Racial",
    "ESTATUTO - CIDADE": "Estatuto da Cidade",
    "ESTATUTO - TORCEDOR": "Estatuto do Torcedor",
  };
  return mapping[tableName] || tableName;
};

const FlashcardsArtigosLeiEstudar = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const codigo = searchParams.get("codigo");
  const artigo = searchParams.get("artigo");
  const [isGenerating, setIsGenerating] = useState(false);

  const areaName = codigo ? getAreaName(codigo) : "";

  // 1. Buscar flashcards do cache (tabela FLASHCARDS - ARTIGOS LEI)
  const { data: flashcardsCache, isLoading: isLoadingCache, refetch: refetchCache } = useQuery({
    queryKey: ["flashcards-cache", areaName, artigo],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("FLASHCARDS - ARTIGOS LEI")
        .select("*")
        .eq("area", areaName)
        .eq("tema", parseInt(artigo as string));

      if (error) throw error;

      if (data && data.length > 0) {
        return data.map((row) => ({
          front: row.pergunta || "",
          back: row.resposta || "",
          exemplo: row.exemplo || undefined,
          "audio-pergunta": row["audio-pergunta"] || undefined,
          "audio-resposta": row["audio-resposta"] || undefined,
        }));
      }
      return null;
    },
    enabled: !!codigo && !!artigo,
  });

  // 2. Buscar conteúdo do artigo do Vade Mecum (para gerar flashcards se necessário)
  const { data: artigoContent } = useQuery({
    queryKey: ["artigo-content", codigo, artigo],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(codigo as any)
        .select("*")
        .eq('"Número do Artigo"', artigo)
        .maybeSingle();

      if (error) throw error;
      return data as { Artigo?: string; "Número do Artigo"?: string } | null;
    },
    enabled: !!codigo && !!artigo && !flashcardsCache,
  });

  // 3. Mutation para gerar flashcards via edge function
  const generateMutation = useMutation({
    mutationFn: async () => {
      if (!artigoContent?.Artigo) {
        throw new Error("Conteúdo do artigo não encontrado");
      }

      const { data, error } = await supabase.functions.invoke('gerar-flashcards', {
        body: {
          content: artigoContent.Artigo,
          tableName: codigo,
          numeroArtigo: artigo,
          area: areaName,
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["flashcards-cache", areaName, artigo] });
      queryClient.invalidateQueries({ queryKey: ["flashcards-existentes", codigo] });
      refetchCache();
    },
    onError: (error) => {
      console.error("Erro ao gerar flashcards:", error);
      toast.error("Erro ao gerar flashcards. Tente novamente.");
    },
  });

  // Se não tem cache e tem conteúdo do artigo, gerar automaticamente
  useEffect(() => {
    if (flashcardsCache === null && artigoContent && !isGenerating && !generateMutation.isPending) {
      setIsGenerating(true);
      generateMutation.mutate();
    }
  }, [flashcardsCache, artigoContent, isGenerating, generateMutation.isPending]);

  if (!codigo || !artigo) {
    navigate("/flashcards/artigos-lei");
    return null;
  }

  // Loading estado inicial
  if (isLoadingCache) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-background/95">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Gerando flashcards
  if (generateMutation.isPending || (flashcardsCache === null && artigoContent)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-background to-background/95 gap-4">
        <div className="flex items-center gap-3">
          <Scale className="w-8 h-8 text-amber-500 animate-pulse" />
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
        <p className="text-muted-foreground text-center px-4">
          Gerando flashcards para o Art. {artigo}...
          <br />
          <span className="text-xs">Isso pode levar alguns segundos</span>
        </p>
      </div>
    );
  }

  // Nenhum flashcard encontrado e sem conteúdo para gerar
  if (!flashcardsCache || flashcardsCache.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-background/95">
        <div className="text-center p-6">
          <p className="text-muted-foreground mb-4">
            Não foi possível carregar os flashcards para o Art. {artigo}
          </p>
          <button 
            onClick={() => navigate(`/flashcards/artigos-lei/temas?codigo=${encodeURIComponent(codigo)}`)}
            className="text-primary underline"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  const tema = `${areaName} - Art. ${artigo}`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/95 pb-24">
      <FlashcardViewer flashcards={flashcardsCache} tema={tema} />
    </div>
  );
};

export default FlashcardsArtigosLeiEstudar;
