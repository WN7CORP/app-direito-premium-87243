import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, X, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Questao {
  id: number;
  numero_questao: number;
  enunciado: string;
  alternativa_a: string;
  alternativa_b: string;
  alternativa_c: string;
  alternativa_d: string;
  alternativa_e: string;
  resposta: string;
  comentario: string;
  area: string;
}

const SimuladoConcursoResolver = () => {
  const navigate = useNavigate();
  const { concurso } = useParams();
  const [questaoAtual, setQuestaoAtual] = useState(0);
  const [respostas, setRespostas] = useState<Record<number, string>>({});
  const [mostrarResultado, setMostrarResultado] = useState(false);
  const [tempoInicio] = useState(Date.now());
  const [tempoDecorrido, setTempoDecorrido] = useState(0);

  // Timer
  useEffect(() => {
    const interval = setInterval(() => {
      setTempoDecorrido(Math.floor((Date.now() - tempoInicio) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [tempoInicio]);

  const formatarTempo = (segundos: number) => {
    const h = Math.floor(segundos / 3600);
    const m = Math.floor((segundos % 3600) / 60);
    const s = segundos % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Buscar questões
  const { data: questoes, isLoading } = useQuery({
    queryKey: ["simulado-questoes", concurso],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("SIMULADO-TJSP")
        .select("*")
        .order("numero_questao", { ascending: true });
      
      if (error) throw error;
      return data as Questao[];
    }
  });

  const questaoAtualData = questoes?.[questaoAtual];
  const totalQuestoes = questoes?.length || 0;
  const progresso = totalQuestoes > 0 ? ((questaoAtual + 1) / totalQuestoes) * 100 : 0;

  const selecionarResposta = (letra: string) => {
    if (mostrarResultado) return;
    setRespostas((prev) => ({
      ...prev,
      [questaoAtual]: letra
    }));
  };

  const proximaQuestao = () => {
    if (questaoAtual < totalQuestoes - 1) {
      setQuestaoAtual((prev) => prev + 1);
      setMostrarResultado(false);
    }
  };

  const questaoAnterior = () => {
    if (questaoAtual > 0) {
      setQuestaoAtual((prev) => prev - 1);
      setMostrarResultado(false);
    }
  };

  const verificarResposta = () => {
    if (!respostas[questaoAtual]) {
      toast.error("Selecione uma alternativa");
      return;
    }
    setMostrarResultado(true);
  };

  const finalizarSimulado = () => {
    const acertos = questoes?.filter(
      (q, idx) => respostas[idx]?.toUpperCase() === q.resposta?.toUpperCase()
    ).length || 0;
    
    navigate(`/ferramentas/simulados/${concurso}/resultado`, {
      state: {
        acertos,
        total: totalQuestoes,
        tempo: tempoDecorrido,
        respostas
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!questaoAtualData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <p className="text-muted-foreground">Nenhuma questão encontrada</p>
        <Button onClick={() => navigate("/ferramentas/simulados")} className="mt-4">
          Voltar
        </Button>
      </div>
    );
  }

  const alternativas = [
    { letra: "A", texto: questaoAtualData.alternativa_a },
    { letra: "B", texto: questaoAtualData.alternativa_b },
    { letra: "C", texto: questaoAtualData.alternativa_c },
    { letra: "D", texto: questaoAtualData.alternativa_d },
    { letra: "E", texto: questaoAtualData.alternativa_e }
  ].filter((a) => a.texto);

  const respostaCorreta = questaoAtualData.resposta?.toUpperCase();
  const respostaSelecionada = respostas[questaoAtual]?.toUpperCase();

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header fixo */}
      <div className="sticky top-0 z-10 bg-background border-b p-3">
        <div className="flex items-center justify-between mb-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/ferramentas/simulados/${concurso}`)}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Sair
          </Button>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            {formatarTempo(tempoDecorrido)}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Progress value={progresso} className="flex-1 h-2" />
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {questaoAtual + 1}/{totalQuestoes}
          </span>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="flex-1 p-3 md:p-6 space-y-4 pb-24">
        {/* Área */}
        <span className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-xs">
          {questaoAtualData.area}
        </span>

        {/* Enunciado */}
        <Card>
          <CardContent className="p-4">
            <p className="text-sm font-medium text-muted-foreground mb-2">
              Questão {questaoAtualData.numero_questao}
            </p>
            <div 
              className="text-sm leading-relaxed whitespace-pre-wrap"
              dangerouslySetInnerHTML={{ __html: questaoAtualData.enunciado }}
            />
          </CardContent>
        </Card>

        {/* Alternativas */}
        <div className="space-y-2">
          {alternativas.map((alt) => {
            const isSelected = respostaSelecionada === alt.letra;
            const isCorrect = alt.letra === respostaCorreta;
            const showCorrect = mostrarResultado && isCorrect;
            const showWrong = mostrarResultado && isSelected && !isCorrect;

            return (
              <button
                key={alt.letra}
                onClick={() => selecionarResposta(alt.letra)}
                disabled={mostrarResultado}
                className={`
                  w-full p-3 rounded-lg border text-left transition-all
                  ${isSelected && !mostrarResultado ? "border-primary bg-primary/10" : ""}
                  ${showCorrect ? "border-green-500 bg-green-500/10" : ""}
                  ${showWrong ? "border-red-500 bg-red-500/10" : ""}
                  ${!isSelected && !showCorrect && !showWrong ? "border-border hover:border-primary/50" : ""}
                  disabled:cursor-default
                `}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`
                      w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium shrink-0
                      ${isSelected && !mostrarResultado ? "bg-primary text-primary-foreground" : ""}
                      ${showCorrect ? "bg-green-500 text-white" : ""}
                      ${showWrong ? "bg-red-500 text-white" : ""}
                      ${!isSelected && !showCorrect && !showWrong ? "bg-muted" : ""}
                    `}
                  >
                    {showCorrect ? <Check className="w-4 h-4" /> : 
                     showWrong ? <X className="w-4 h-4" /> : alt.letra}
                  </span>
                  <span className="text-sm flex-1">{alt.texto}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Comentário */}
        {mostrarResultado && questaoAtualData.comentario && (
          <Card className="bg-muted/30">
            <CardContent className="p-4">
              <p className="text-sm font-medium mb-2">Comentário</p>
              <p className="text-sm text-muted-foreground">
                {questaoAtualData.comentario}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Footer fixo */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-3">
        <div className="flex gap-2 max-w-3xl mx-auto">
          <Button
            variant="outline"
            onClick={questaoAnterior}
            disabled={questaoAtual === 0}
            className="flex-1"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Anterior
          </Button>
          
          {!mostrarResultado ? (
            <Button onClick={verificarResposta} className="flex-1">
              Verificar
            </Button>
          ) : questaoAtual < totalQuestoes - 1 ? (
            <Button onClick={proximaQuestao} className="flex-1">
              Próxima
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={finalizarSimulado} className="flex-1">
              Finalizar
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SimuladoConcursoResolver;
