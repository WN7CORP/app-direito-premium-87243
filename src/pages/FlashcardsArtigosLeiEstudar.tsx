import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { FlashcardViewer } from "@/components/FlashcardViewer";

const FlashcardsArtigosLeiEstudar = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const codigo = searchParams.get("codigo");
  const artigo = searchParams.get("artigo");

  const { data: flashcards, isLoading } = useQuery({
    queryKey: ["flashcards-artigos-lei-estudar", codigo, artigo],
    queryFn: async () => {
      let query = supabase
        .from("FLASHCARDS - ARTIGOS LEI")
        .select("*")
        .eq("area", codigo as string);
      
      if (artigo) {
        query = query.eq("tema", parseInt(artigo));
      }

      const { data, error } = await query;

      if (error) throw error;

      return data.map((row) => ({
        front: row.pergunta || "",
        back: row.resposta || "",
        exemplo: row.exemplo || undefined,
        "audio-pergunta": row["audio-pergunta"] || undefined,
        "audio-resposta": row["audio-resposta"] || undefined,
      }));
    },
    enabled: !!codigo,
  });

  if (!codigo) {
    navigate("/flashcards/artigos-lei");
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-background/95">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!flashcards || flashcards.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-background/95">
        <div className="text-center p-6">
          <p className="text-muted-foreground mb-4">Nenhum flashcard encontrado</p>
          <button 
            onClick={() => navigate("/flashcards/artigos-lei")}
            className="text-primary underline"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  const tema = artigo ? `${codigo} - Art. ${artigo}` : codigo;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/95 pb-24">
      <FlashcardViewer flashcards={flashcards} tema={tema || undefined} />
    </div>
  );
};

export default FlashcardsArtigosLeiEstudar;
