import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle2, Clock, ArrowLeft, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useState, useMemo } from "react";

// Função para normalizar texto (remover acentos e lowercase)
const normalizeText = (text: string | null | undefined): string => {
  if (!text) return "";
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
};

interface Materia {
  id: number;
  area: string;
  materia: string;
}

interface Resumo {
  id: number;
  area: string;
  tema: string;
  subtema: string | null;
}

const OABOQueEstudarArea = () => {
  const navigate = useNavigate();
  const { area } = useParams<{ area: string }>();
  const [searchTerm, setSearchTerm] = useState("");

  const areaDecoded = decodeURIComponent(area || "");

  // Buscar matérias da área (são os valores da coluna correspondente)
  const { data: dadosTabela, isLoading: loadingMaterias } = useQuery({
    queryKey: ["plano-estudos-materias", areaDecoded],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("PLANO DE ESTUDOS- MATERIAS")
        .select("*");

      if (error) {
        console.error("Erro ao buscar matérias:", error);
        throw error;
      }

      console.log("Dados da tabela:", data);
      console.log("Área selecionada:", areaDecoded);

      // Extrair matérias da coluna correspondente à área
      const materiasDaArea: Materia[] = [];
      
      data?.forEach((row: any, index: number) => {
        // Verificar se a coluna existe e tem valor
        if (row[areaDecoded] && row[areaDecoded].toString().trim() !== "") {
          materiasDaArea.push({
            id: index + 1,
            area: areaDecoded,
            materia: row[areaDecoded].toString().trim(),
          });
        }
      });

      console.log("Matérias extraídas:", materiasDaArea);
      return materiasDaArea;
    },
  });

  // Buscar todos os resumos para fazer matching
  const { data: resumos, isLoading: loadingResumos } = useQuery({
    queryKey: ["resumos-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("RESUMO")
        .select("id, area, tema, subtema");

      if (error) throw error;
      return data as Resumo[];
    },
  });

  // Fazer matching de matérias com resumos
  const materiasComResumos = useMemo(() => {
    if (!dadosTabela || !resumos) return [];

    return dadosTabela.map((materia) => {
      const materiaNormalizada = normalizeText(materia.materia);

      // Buscar match no tema primeiro
      let resumoMatch = resumos.find((resumo) => {
        const temaNormalizado = normalizeText(resumo.tema);
        return temaNormalizado && temaNormalizado === materiaNormalizada;
      });

      // Se não achou no tema, buscar no subtema
      if (!resumoMatch) {
        resumoMatch = resumos.find((resumo) => {
          const subtemaNormalizado = normalizeText(resumo.subtema);
          return subtemaNormalizado && subtemaNormalizado === materiaNormalizada;
        });
      }

      return {
        ...materia,
        temResumo: !!resumoMatch,
        resumo: resumoMatch || null,
      };
    });
  }, [dadosTabela, resumos]);

  // Filtrar matérias
  const materiasFiltradas = useMemo(() => {
    if (!searchTerm) return materiasComResumos;
    const searchLower = searchTerm.toLowerCase();
    return materiasComResumos.filter((materia) =>
      materia.materia.toLowerCase().includes(searchLower)
    );
  }, [materiasComResumos, searchTerm]);

  const isLoading = loadingMaterias || loadingResumos;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  const totalMaterias = materiasComResumos.length;
  const materiasComConteudo = materiasComResumos.filter((m) => m.temResumo).length;

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="relative bg-gradient-to-br from-[hsl(0,75%,55%)] to-[hsl(350,70%,45%)] text-white p-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 text-white hover:bg-white/20"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="max-w-4xl mx-auto pt-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">{areaDecoded}</h1>
          <p className="text-sm text-white/90">
            {totalMaterias} {totalMaterias === 1 ? "matéria" : "matérias"} •{" "}
            {materiasComConteudo} com conteúdo disponível
          </p>
        </div>
      </div>

      <div className="px-3 py-6 max-w-4xl mx-auto">
        {/* Barra de Pesquisa */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <Input
              placeholder="Buscar matéria..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-base"
            />
          </CardContent>
        </Card>

        {/* Lista de Matérias */}
        <div className="space-y-3">
          {materiasFiltradas.map((materia) => (
            <Card key={materia.id} className="overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-base">
                        {materia.materia}
                      </h3>
                      {materia.temResumo ? (
                        <Badge className="bg-green-500/10 text-green-700 hover:bg-green-500/20 border-green-500/20">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Conteúdo disponível
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="border">
                          <Clock className="w-3 h-3 mr-1" />
                          Em breve
                        </Badge>
                      )}
                    </div>
                    {materia.temResumo && materia.resumo && (
                      <p className="text-sm text-muted-foreground">
                        Disponível em: {materia.resumo.area} → {materia.resumo.tema}
                      </p>
                    )}
                  </div>
                  {materia.temResumo && materia.resumo && (
                    <Button
                      size="sm"
                      onClick={() =>
                        navigate(
                          `/resumos-juridicos/prontos/${encodeURIComponent(
                            materia.resumo!.area
                          )}/${encodeURIComponent(materia.resumo!.tema)}`
                        )
                      }
                      className="shrink-0"
                    >
                      Ir para conteúdo
                      <ExternalLink className="w-4 h-4 ml-1" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {materiasFiltradas.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              Nenhuma matéria encontrada para "{searchTerm}"
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OABOQueEstudarArea;
