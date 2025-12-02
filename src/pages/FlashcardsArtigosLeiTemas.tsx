import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const FlashcardsArtigosLeiTemas = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const codigo = searchParams.get("codigo");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: artigos, isLoading } = useQuery({
    queryKey: ["flashcards-artigos-lei-artigos", codigo],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("FLASHCARDS - ARTIGOS LEI")
        .select("tema")
        .eq("area", codigo as string);

      if (error) throw error;

      // Agrupar por tema (artigo) e contar
      const artigosMap = new Map<string, number>();
      data.forEach((row) => {
        if (row.tema !== null && row.tema !== undefined) {
          const artigoStr = String(row.tema);
          artigosMap.set(artigoStr, (artigosMap.get(artigoStr) || 0) + 1);
        }
      });

      return Array.from(artigosMap.entries()).map(([artigo, count]) => ({
        artigo,
        count
      })).sort((a, b) => {
        // Tentar ordenar numericamente
        const numA = parseInt(a.artigo);
        const numB = parseInt(b.artigo);
        if (!isNaN(numA) && !isNaN(numB)) {
          return numA - numB;
        }
        return a.artigo.localeCompare(b.artigo);
      });
    },
    enabled: !!codigo,
  });

  const glowColors = [
    "rgb(16, 185, 129)",
    "rgb(139, 92, 246)",
    "rgb(239, 68, 68)", 
    "rgb(245, 158, 11)",
    "rgb(59, 130, 246)",
  ];

  const filteredArtigos = artigos?.filter((item) =>
    item.artigo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!codigo) {
    navigate("/flashcards/artigos-lei");
    return null;
  }

  return (
    <div className="px-3 py-4 max-w-4xl mx-auto pb-24">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-emerald-600 shadow-lg shadow-emerald-500/50">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold">{codigo}</h1>
            <p className="text-sm text-muted-foreground">
              Escolha um artigo para estudar
            </p>
          </div>
        </div>
      </div>

      {/* Campo de Busca */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex gap-2">
            <Input
              placeholder="Buscar artigo..."
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

      {/* Artigos Disponíveis */}
      <div className="mb-6">
        <h2 className="text-lg font-bold mb-3">Artigos Disponíveis</h2>
        
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-[100px] w-full rounded-lg" />
            ))}
          </div>
        ) : filteredArtigos?.length === 0 ? (
          <Card className="p-6 text-center">
            <p className="text-muted-foreground">Nenhum artigo encontrado</p>
          </Card>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredArtigos?.map((item, index) => (
              <Card
                key={item.artigo}
                className="cursor-pointer hover:scale-105 hover:shadow-xl hover:-translate-y-1 transition-all border-2 border-transparent hover:border-primary/50 bg-gradient-to-br from-card to-card/80 group overflow-hidden relative animate-fade-in"
                onClick={() =>
                  navigate(`/flashcards/artigos-lei/estudar?codigo=${encodeURIComponent(codigo)}&artigo=${encodeURIComponent(item.artigo)}`)
                }
              >
                <div 
                  className="absolute top-0 left-0 right-0 h-1 opacity-80"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${glowColors[index % glowColors.length]}, transparent)`,
                    boxShadow: `0 0 20px ${glowColors[index % glowColors.length]}`
                  }}
                />
                
                <CardContent className="p-4 flex flex-col items-center text-center min-h-[100px] justify-center">
                  <h3 className="font-bold text-lg mb-1">Art. {item.artigo}</h3>
                  <p className="text-xs text-muted-foreground">
                    {item.count} flashcard{item.count !== 1 ? "s" : ""}
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

export default FlashcardsArtigosLeiTemas;
