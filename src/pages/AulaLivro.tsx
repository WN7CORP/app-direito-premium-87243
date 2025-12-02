import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, BookOpen, Clock, Loader2, GraduationCap, Play, ChevronRight } from "lucide-react";
import { AulaModuloNav } from "@/components/aula/AulaModuloNav";
import { AulaTeoriaEnhanced } from "@/components/aula/AulaTeoriaEnhanced";
import { ModuloTransitionCard } from "@/components/aula/ModuloTransitionCard";
import { MatchingGame } from "@/components/aula/MatchingGame";
import { FlashcardViewer } from "@/components/FlashcardViewer";
import { QuizViewerEnhanced } from "@/components/QuizViewerEnhanced";
import { AulaProvaFinal } from "@/components/aula/AulaProvaFinal";
import { AulaResultado } from "@/components/aula/AulaResultado";

interface AulaEstrutura {
  titulo: string;
  descricao: string;
  area?: string;
  tempoEstimado?: string;
  modulos: Array<{
    id: number;
    nome: string;
    icone?: string;
    teoria: string;
    exemploPratico?: {
      cenario: string;
      analise: string;
      solucao: string;
    };
    quizRapido?: Array<any>;
    resumo?: string[];
    matching: Array<{ termo: string; definicao: string }>;
    flashcards: Array<{ frente: string; verso: string; exemplo?: string }>;
    questoes: Array<any>;
  }>;
  provaFinal: Array<any>;
}

type Etapa = 'intro' | 'transicao' | 'teoria' | 'matching' | 'flashcards' | 'questoes' | 'provaFinal' | 'resultado';

const loadingMessages = [
  "Analisando o conteúdo do livro...",
  "Identificando os principais tópicos...",
  "Estruturando os módulos da aula...",
  "Criando exemplos práticos...",
  "Elaborando questões de fixação...",
  "Desenvolvendo flashcards...",
  "Montando a prova final...",
  "Finalizando a estrutura da aula...",
  "Revisando o conteúdo gerado...",
  "Quase pronto..."
];

const AulaLivro = () => {
  const { livroId } = useParams();
  const navigate = useNavigate();
  
  const [estrutura, setEstrutura] = useState<AulaEstrutura | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [etapaAtual, setEtapaAtual] = useState<Etapa>('intro');
  const [moduloAtual, setModuloAtual] = useState(1);
  const [acertosProva, setAcertosProva] = useState(0);
  const [totalProva, setTotalProva] = useState(0);
  const [aulaId, setAulaId] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState(loadingMessages[0]);
  const [progress, setProgress] = useState(0);

  // Buscar dados do livro
  const { data: livro, isLoading: isLoadingLivro } = useQuery({
    queryKey: ["livro-aula", livroId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("BIBLIOTECA-ESTUDOS")
        .select("*")
        .eq("id", parseInt(livroId || "0"))
        .single();
      if (error) throw error;
      return data;
    },
  });

  // Verificar se já existe aula salva
  const { data: aulaExistente, isLoading: isLoadingAula } = useQuery({
    queryKey: ["aula-livro", livroId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("aulas_livros" as any)
        .select("*")
        .eq("livro_id", parseInt(livroId || "0"))
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as {
        id: string;
        livro_id: number;
        tema: string;
        area: string;
        titulo: string;
        descricao: string;
        estrutura_completa: any;
        visualizacoes: number;
      } | null;
    },
    enabled: !!livroId,
  });

  // Carregar aula existente automaticamente
  useEffect(() => {
    if (aulaExistente && !estrutura) {
      const estruturaCompleta = aulaExistente.estrutura_completa as unknown as AulaEstrutura;
      setEstrutura(estruturaCompleta);
      setAulaId(aulaExistente.id);
    }
  }, [aulaExistente]);

  // Simular progresso durante geração
  useEffect(() => {
    if (isGenerating) {
      let messageIndex = 0;
      let currentProgress = 0;
      
      const interval = setInterval(() => {
        currentProgress = Math.min(currentProgress + Math.random() * 8 + 2, 95);
        setProgress(currentProgress);
        
        if (currentProgress > (messageIndex + 1) * 10 && messageIndex < loadingMessages.length - 1) {
          messageIndex++;
          setLoadingMessage(loadingMessages[messageIndex]);
        }
      }, 800);

      return () => clearInterval(interval);
    }
  }, [isGenerating]);

  const gerarAula = async () => {
    setIsGenerating(true);
    setProgress(0);
    setLoadingMessage(loadingMessages[0]);
    
    try {
      const { data, error } = await supabase.functions.invoke('gerar-aula-livro', {
        body: { livro_id: parseInt(livroId || "0") }
      });

      if (error) throw error;

      if (data.estrutura) {
        setEstrutura(data.estrutura);
        setAulaId(data.aulaId || null);
        toast.success('Aula gerada com sucesso!');
      } else {
        throw new Error('Estrutura não retornada');
      }
    } catch (error: any) {
      console.error('Erro ao gerar aula:', error);
      toast.error('Erro ao gerar aula. Tente novamente.');
    } finally {
      setIsGenerating(false);
      setProgress(100);
    }
  };

  const iniciarAula = () => {
    setModuloAtual(1);
    setEtapaAtual('transicao');
  };

  const calcularProgresso = () => {
    if (!estrutura) return 0;
    
    const totalEtapas = estrutura.modulos.length * 4 + 1;
    const etapaPorModulo = moduloAtual > 1 ? (moduloAtual - 1) * 4 : 0;
    
    let etapaAtualNum = 0;
    if (etapaAtual === 'transicao') etapaAtualNum = 0;
    else if (etapaAtual === 'teoria') etapaAtualNum = 1;
    else if (etapaAtual === 'matching') etapaAtualNum = 2;
    else if (etapaAtual === 'flashcards') etapaAtualNum = 3;
    else if (etapaAtual === 'questoes') etapaAtualNum = 4;
    else if (etapaAtual === 'provaFinal') return 95;
    
    return Math.min((etapaPorModulo + etapaAtualNum) / totalEtapas * 100, 100);
  };

  const proximaEtapa = () => {
    if (etapaAtual === 'transicao') {
      setEtapaAtual('teoria');
    } else if (etapaAtual === 'teoria') {
      setEtapaAtual('matching');
    } else if (etapaAtual === 'matching') {
      setEtapaAtual('flashcards');
    } else if (etapaAtual === 'flashcards') {
      setEtapaAtual('questoes');
    } else if (etapaAtual === 'questoes') {
      if (estrutura && moduloAtual < estrutura.modulos.length) {
        setModuloAtual(moduloAtual + 1);
        setEtapaAtual('transicao');
      } else {
        setEtapaAtual('provaFinal');
      }
    }
  };

  const handleSair = () => {
    navigate(`/biblioteca-estudos/${livroId}`);
  };

  const handleRefazer = () => {
    setModuloAtual(1);
    setEtapaAtual('transicao');
  };

  const finalizarAula = async (acertos: number, total: number) => {
    setAcertosProva(acertos);
    setTotalProva(total);
    setEtapaAtual('resultado');

    // Atualizar visualizações
    if (aulaId) {
      await supabase
        .from('aulas_livros' as any)
        .update({ visualizacoes: (aulaExistente?.visualizacoes || 0) + 1 })
        .eq('id', aulaId);
    }
  };

  // Loading inicial
  if (isLoadingLivro || isLoadingAula) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Livro não encontrado
  if (!livro) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-muted-foreground">Livro não encontrado</p>
        <Button onClick={() => navigate(-1)}>Voltar</Button>
      </div>
    );
  }

  // Tela de resultado
  if (etapaAtual === 'resultado' && estrutura) {
    return (
      <AulaResultado
        titulo={estrutura.titulo}
        acertos={acertosProva}
        total={totalProva}
        onRefazer={handleRefazer}
      />
    );
  }

  // Tela de intro (antes de iniciar a aula)
  if (etapaAtual === 'intro') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5 pb-20">
        <div className="max-w-2xl mx-auto px-4 py-8">
          {/* Header */}
          <Button
            variant="ghost"
            onClick={handleSair}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao livro
          </Button>

          {/* Card principal */}
          <Card className="border-primary/20 overflow-hidden">
            {/* Capa do livro */}
            {livro["Capa-livro"] && (
              <div className="w-full h-48 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                <img
                  src={livro["Capa-livro"]}
                  alt={livro.Tema || ""}
                  className="h-40 object-contain rounded-lg shadow-lg"
                />
              </div>
            )}

            <CardContent className="p-6 space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm mb-4">
                  <GraduationCap className="w-4 h-4" />
                  Aula Interativa
                </div>
                <h1 className="text-2xl md:text-3xl font-bold mb-2">
                  {estrutura?.titulo || livro.Tema}
                </h1>
                {livro["Área"] && (
                  <p className="text-muted-foreground">{livro["Área"]}</p>
                )}
              </div>

              {/* Se está gerando */}
              {isGenerating && (
                <div className="space-y-4 py-6">
                  <div className="flex justify-center">
                    <Loader2 className="w-12 h-12 animate-spin text-primary" />
                  </div>
                  <p className="text-center text-muted-foreground animate-pulse">
                    {loadingMessage}
                  </p>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-center text-sm text-muted-foreground">
                    {Math.round(progress)}%
                  </p>
                </div>
              )}

              {/* Se já tem aula carregada */}
              {estrutura && !isGenerating && (
                <div className="space-y-4">
                  <p className="text-muted-foreground text-center">
                    {estrutura.descricao}
                  </p>

                  <div className="flex justify-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {estrutura.tempoEstimado || "~45 min"}
                    </div>
                    <div className="flex items-center gap-1">
                      <BookOpen className="w-4 h-4" />
                      {estrutura.modulos.length} Módulos
                    </div>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="font-medium mb-2">Esta aula aborda:</p>
                    <ul className="space-y-1">
                      {estrutura.modulos.map((m, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                          {m.nome}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Button
                    onClick={iniciarAula}
                    size="lg"
                    className="w-full gap-2"
                  >
                    <Play className="w-5 h-5" />
                    Iniciar Aula
                  </Button>
                </div>
              )}

              {/* Se não tem aula e não está gerando */}
              {!estrutura && !isGenerating && (
                <div className="space-y-4 text-center">
                  <p className="text-muted-foreground">
                    Ainda não existe uma aula para este livro. Gere uma aula completa com teoria, exercícios, flashcards e prova final.
                  </p>
                  <Button
                    onClick={gerarAula}
                    size="lg"
                    className="gap-2"
                  >
                    <GraduationCap className="w-5 h-5" />
                    Gerar Aula Interativa
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Aula em andamento
  const modulo = estrutura?.modulos.find(m => m.id === moduloAtual);

  if (!estrutura || !modulo) return null;

  return (
    <>
      <AulaModuloNav
        modulos={estrutura.modulos.map(m => ({ id: m.id, nome: m.nome }))}
        moduloAtual={moduloAtual}
        progresso={calcularProgresso()}
        onSair={handleSair}
        onMudarModulo={(id) => {
          setModuloAtual(id);
          setEtapaAtual('transicao');
        }}
      />

      {etapaAtual === 'transicao' && (
        <ModuloTransitionCard
          moduloNumero={moduloAtual}
          moduloNome={modulo.nome}
          icone={modulo.icone}
          onComplete={proximaEtapa}
        />
      )}

      {etapaAtual === 'teoria' && (
        <AulaTeoriaEnhanced
          moduloNumero={moduloAtual}
          titulo={modulo.nome}
          conteudo={modulo.teoria}
          exemploPratico={modulo.exemploPratico}
          quizRapido={modulo.quizRapido}
          resumo={modulo.resumo}
          onProximo={proximaEtapa}
          proximoLabel="Próxima Etapa: Jogo Matching"
        />
      )}

      {etapaAtual === 'matching' && (
        <MatchingGame
          matches={modulo.matching}
          onProximo={proximaEtapa}
        />
      )}

      {etapaAtual === 'flashcards' && (
        <div className="min-h-screen pt-16 pb-8 px-3 bg-gradient-to-br from-background to-primary/5">
          <div className="max-w-2xl mx-auto space-y-4">
            <FlashcardViewer 
              flashcards={modulo.flashcards.map(f => ({
                front: f.frente,
                back: f.verso,
                exemplo: f.exemplo
              }))} 
              tema={modulo.nome} 
            />
            <div className="flex justify-end">
              <Button
                onClick={proximaEtapa}
                size="lg"
                className="gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90"
              >
                Próximo: Questões
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {etapaAtual === 'questoes' && (
        <div className="min-h-screen pt-16 pb-8 px-3 bg-gradient-to-br from-background to-primary/5">
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="mb-3">
              <h2 className="text-xl md:text-2xl font-bold">Questões - {modulo.nome}</h2>
            </div>
            <QuizViewerEnhanced questions={modulo.questoes} />
            <div className="flex justify-end">
              <Button
                onClick={proximaEtapa}
                size="lg"
                className="gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90"
              >
                {moduloAtual < estrutura.modulos.length ? "Próximo Módulo" : "Prova Final"}
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {etapaAtual === 'provaFinal' && (
        <AulaProvaFinal
          questoes={estrutura.provaFinal}
          onFinalizar={finalizarAula}
        />
      )}
    </>
  );
};

export default AulaLivro;
