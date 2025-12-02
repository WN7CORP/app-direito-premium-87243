import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Scale, TrendingUp, Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const FlashcardsArtigosLei = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: codigos, isLoading } = useQuery({
    queryKey: ["flashcards-artigos-lei-codigos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("FLASHCARDS - ARTIGOS LEI")
        .select("area");

      if (error) throw error;

      // Agrupar por area (código) e contar
      const codigosMap = new Map<string, number>();
      data.forEach((row) => {
        if (row.area) {
          codigosMap.set(row.area, (codigosMap.get(row.area) || 0) + 1);
        }
      });

      return Array.from(codigosMap.entries()).map(([codigo, count]) => ({
        codigo,
        count
      })).sort((a, b) => a.codigo.localeCompare(b.codigo));
    },
  });

  const codigoIcons = ["⚖️", "📜", "🏛️", "💼", "📋", "🔒"];
  const glowColors = [
    "rgb(16, 185, 129)",
    "rgb(139, 92, 246)",
    "rgb(239, 68, 68)", 
    "rgb(245, 158, 11)",
    "rgb(59, 130, 246)",
    "rgb(236, 72, 153)",
  ];

  const filteredCodigos = codigos?.filter((item) =>
    item.codigo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="px-3 py-4 max-w-4xl mx-auto pb-24">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-emerald-600 shadow-lg shadow-emerald-500/50">
            <Scale className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold">Artigos da Lei</h1>
            <p className="text-sm text-muted-foreground">
              Escolha um código para estudar
            </p>
          </div>
        </div>
      </div>

      {/* Campo de Busca */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex gap-2">
            <Input
              placeholder="Buscar código..."
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

      {/* Códigos Disponíveis */}
      <div className="mb-6">
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Códigos Disponíveis
        </h2>
        
        {isLoading ? (
          <div className="grid grid-cols-1 gap-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-[80px] w-full rounded-lg" />
            ))}
          </div>
        ) : filteredCodigos?.length === 0 ? (
          <Card className="p-6 text-center">
            <p className="text-muted-foreground">Nenhum código encontrado</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {filteredCodigos?.map((item, index) => (
              <Card
                key={item.codigo}
                className="cursor-pointer hover:scale-[1.02] hover:shadow-xl transition-all border-2 border-transparent hover:border-primary/50 bg-gradient-to-br from-card to-card/80 group overflow-hidden relative animate-fade-in"
                onClick={() =>
                  navigate(`/flashcards/artigos-lei/temas?codigo=${encodeURIComponent(item.codigo)}`)
                }
              >
                <div 
                  className="absolute top-0 left-0 right-0 h-1 opacity-80"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${glowColors[index % glowColors.length]}, transparent)`,
                    boxShadow: `0 0 20px ${glowColors[index % glowColors.length]}`
                  }}
                />
                
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="text-3xl">{codigoIcons[index % codigoIcons.length]}</div>
                  <div className="flex-1">
                    <h3 className="font-bold text-base">{item.codigo}</h3>
                    <p className="text-xs text-muted-foreground">
                      {item.count} flashcard{item.count !== 1 ? "s" : ""} disponíve{item.count !== 1 ? "is" : "l"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FlashcardsArtigosLei;
