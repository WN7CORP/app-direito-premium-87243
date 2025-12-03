import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Search, Scale, CheckCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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

const FlashcardsArtigosLeiTemas = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const codigo = searchParams.get("codigo");
  const [searchTerm, setSearchTerm] = useState("");

  // Buscar artigos diretamente da tabela do Vade Mecum
  const { data: artigos, isLoading: isLoadingArtigos } = useQuery({
    queryKey: ["vade-mecum-artigos", codigo],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(codigo as any)
        .select('"Número do Artigo"')
        .order('"Número do Artigo"');

      if (error) throw error;

      return data
        .filter((row: any) => row["Número do Artigo"])
        .map((row: any) => ({
          numero: String(row["Número do Artigo"]),
        }));
    },
    enabled: !!codigo,
  });

  // Buscar quais artigos já têm flashcards gerados
  const { data: flashcardsExistentes } = useQuery({
    queryKey: ["flashcards-existentes", codigo],
    queryFn: async () => {
      const areaName = getAreaName(codigo!);
      const { data, error } = await supabase
        .from("FLASHCARDS - ARTIGOS LEI")
        .select("tema")
        .eq("area", areaName);

      if (error) throw error;

      // Criar um Set com os artigos que já têm flashcards
      const artigosComFlashcards = new Set<string>();
      data.forEach((row) => {
        if (row.tema !== null && row.tema !== undefined) {
          artigosComFlashcards.add(String(row.tema));
        }
      });

      return artigosComFlashcards;
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
    item.numero.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Ordenar numericamente
  const sortedArtigos = filteredArtigos?.sort((a, b) => {
    const numA = parseInt(a.numero.replace(/\D/g, '')) || 0;
    const numB = parseInt(b.numero.replace(/\D/g, '')) || 0;
    return numA - numB;
  });

  if (!codigo) {
    navigate("/flashcards/artigos-lei");
    return null;
  }

  const areaName = getAreaName(codigo);

  return (
    <div className="px-3 py-4 max-w-4xl mx-auto pb-24">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-emerald-600 shadow-lg shadow-emerald-500/50">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold">{areaName}</h1>
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

      {/* Legenda */}
      <div className="flex gap-4 mb-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <CheckCircle className="w-4 h-4 text-emerald-500" />
          <span>Flashcards prontos</span>
        </div>
        <div className="flex items-center gap-1">
          <Scale className="w-4 h-4 text-amber-500" />
          <span>A gerar</span>
        </div>
      </div>

      {/* Artigos Disponíveis */}
      <div className="mb-6">
        <h2 className="text-lg font-bold mb-3">
          Artigos Disponíveis {sortedArtigos && `(${sortedArtigos.length})`}
        </h2>
        
        {isLoadingArtigos ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-[80px] w-full rounded-lg" />
            ))}
          </div>
        ) : sortedArtigos?.length === 0 ? (
          <Card className="p-6 text-center">
            <p className="text-muted-foreground">Nenhum artigo encontrado</p>
          </Card>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {sortedArtigos?.map((item, index) => {
              const temFlashcards = flashcardsExistentes?.has(item.numero);
              
              return (
                <Card
                  key={item.numero}
                  className="cursor-pointer hover:scale-105 hover:shadow-xl hover:-translate-y-1 transition-all border-2 border-transparent hover:border-primary/50 bg-gradient-to-br from-card to-card/80 group overflow-hidden relative animate-fade-in"
                  onClick={() =>
                    navigate(`/flashcards/artigos-lei/estudar?codigo=${encodeURIComponent(codigo)}&artigo=${encodeURIComponent(item.numero)}`)
                  }
                >
                  <div 
                    className="absolute top-0 left-0 right-0 h-1 opacity-80"
                    style={{
                      background: `linear-gradient(90deg, transparent, ${glowColors[index % glowColors.length]}, transparent)`,
                      boxShadow: `0 0 20px ${glowColors[index % glowColors.length]}`
                    }}
                  />
                  
                  <CardContent className="p-3 flex flex-col items-center text-center min-h-[80px] justify-center">
                    <div className="flex items-center gap-2 mb-1">
                      {temFlashcards ? (
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Scale className="w-4 h-4 text-amber-500" />
                      )}
                      <h3 className="font-bold text-base">Art. {item.numero}</h3>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {temFlashcards ? "Prontos" : ""}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default FlashcardsArtigosLeiTemas;
