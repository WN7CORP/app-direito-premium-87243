import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, Plus, Minus, ArrowUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { fetchAllRows } from "@/lib/fetchAllRows";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import StickyAudioPlayer from "@/components/StickyAudioPlayer";
import ExplicacaoModal from "@/components/ExplicacaoModal";
import VideoAulaModal from "@/components/VideoAulaModal";
import TermosModal from "@/components/TermosModal";
import QuestoesModal from "@/components/QuestoesModal";
import { FlashcardViewer } from "@/components/FlashcardViewer";
import { formatTextWithUppercase } from "@/lib/textFormatter";
import { BuscaCompacta } from "@/components/BuscaCompacta";
import { SumulaActionsMenu } from "@/components/SumulaActionsMenu";
import { VadeMecumTabs } from "@/components/VadeMecumTabs";
import { VadeMecumPlaylist } from "@/components/VadeMecumPlaylist";
import { VadeMecumRanking } from "@/components/VadeMecumRanking";
import { useIndexedDBCache } from "@/hooks/useIndexedDBCache";
import { SumulaCard } from "@/components/SumulaCard";
interface Sumula {
  id: number;
  "Título da Súmula": string | null;
  "Texto da Súmula": string | null;
  "Narração": string | null;
  "Data de Aprovação": string | null;
}
const SumulaView = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const contentRef = useRef<HTMLDivElement>(null);
  const firstResultRef = useRef<HTMLDivElement>(null);
  const [fontSize, setFontSize] = useState(15);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<'lista' | 'expandido'>('expandido');
  const [activeTab, setActiveTab] = useState<'artigos' | 'playlist' | 'ranking'>('artigos');
  const { toast } = useToast();

  // Get table name
  const tableMap: { [key: string]: string } = {
    'vinculantes': 'SUMULAS VINCULANTES',
    'stf': 'SUMULAS STF',
    'stj': 'SUMULAS STJ',
    'tst': 'SUMULAS TST',
    'tse': 'SUMULAS TSE',
    'stm': 'SUMULAS STM',
    'tcu': 'SUMULAS TCU',
    'cnmp': 'ENUNCIADOS CNMP',
    'cnj': 'ENUNCIADOS CNJ'
  };
  const tableName = tableMap[id as string] || '';

  // IndexedDB Cache
  const { cachedData, saveToCache, isLoadingCache } = useIndexedDBCache<Sumula>(tableName);

  // Auto-search based on URL parameter
  useEffect(() => {
    const sumulaParam = searchParams.get('numero');
    if (sumulaParam) {
      setSearchQuery(sumulaParam);
    }
  }, [searchParams]);
  const [displayLimit, setDisplayLimit] = useState(50);
  const [stickyPlayerOpen, setStickyPlayerOpen] = useState(false);
  const [currentAudio, setCurrentAudio] = useState({
    url: "",
    title: "",
    isComment: false
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState({
    artigo: "",
    numeroArtigo: "",
    tipo: "explicacao" as "explicacao" | "exemplo",
    nivel: "tecnico" as "tecnico" | "simples"
  });
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [videoModalData, setVideoModalData] = useState({
    videoUrl: "",
    artigo: "",
    numeroArtigo: ""
  });
  const [flashcardsModalOpen, setFlashcardsModalOpen] = useState(false);
  const [flashcardsData, setFlashcardsData] = useState<any[]>([]);
  const [loadingFlashcards, setLoadingFlashcards] = useState(false);
  const [termosModalOpen, setTermosModalOpen] = useState(false);
  const [termosData, setTermosData] = useState({
    artigo: "",
    numeroArtigo: ""
  });
  const [questoesModalOpen, setQuestoesModalOpen] = useState(false);
  const [questoesData, setQuestoesData] = useState({
    artigo: "",
    numeroArtigo: ""
  });
  const categoryNames: {
    [key: string]: string;
  } = {
    vinculantes: "Súmulas Vinculantes STF",
    stf: "Súmulas STF",
    stj: "Súmulas STJ",
    tst: "Súmulas TST",
    tse: "Súmulas TSE",
    stm: "Súmulas STM",
    tcu: "Súmulas TCU",
    cnmp: "Enunciados CNMP",
    cnj: "Enunciados CNJ"
  };
  const categoryName = categoryNames[id as string] || "Súmulas";

  // Fetch sumulas with React Query + IndexedDB cache
  const { data: sumulas = [], isLoading } = useQuery({
    queryKey: ['sumulas-v3', id],
    queryFn: async () => {
      // Usar cache primeiro se disponível
      if (cachedData && cachedData.length > 0) {
        return cachedData;
      }

      if (!tableName) {
        console.error("Tabela não encontrada para categoria:", id);
        return [];
      }

      const data = await fetchAllRows<Sumula>(tableName, "id");
      const typedData = data as any as Sumula[];
      
      // Salvar em cache
      if (typedData.length > 0) {
        await saveToCache(typedData);
      }
      
      return typedData;
    },
    staleTime: Infinity, // Cache nunca expira (atualiza só manualmente)
    gcTime: 1000 * 60 * 60 * 24, // 24h
    enabled: !isLoadingCache // Só buscar depois de verificar cache
  });

  // Filter and limit sumulas with useMemo
  const filteredSumulas = useMemo(() => {
    if (!searchQuery) return sumulas;
    const searchLower = searchQuery.toLowerCase().trim();
    const isNumericSearch = /^\d+$/.test(searchLower);
    return sumulas.filter(sumula => {
      const titulo = sumula["Título da Súmula"]?.toLowerCase();
      const texto = sumula["Texto da Súmula"]?.toLowerCase();
      const numero = sumula.id?.toString();

      // Se for busca numérica, só buscar por número exato
      if (isNumericSearch) {
        return numero === searchLower;
      }

      // Busca textual parcial apenas se não for numérica
      return titulo?.includes(searchLower) || texto?.includes(searchLower);
    });
  }, [sumulas, searchQuery]);
  const displayedSumulas = useMemo(() => {
    return searchQuery ? filteredSumulas : filteredSumulas.slice(0, displayLimit);
  }, [filteredSumulas, displayLimit, searchQuery]);

  // Filtrar súmulas com áudio para playlist
  const sumulasComAudio = useMemo(() => 
    sumulas.filter(s => s["Narração"]), 
    [sumulas]
  );

  // Auto-scroll to first result when searching
  useEffect(() => {
    if (searchQuery && filteredSumulas.length > 0 && firstResultRef.current) {
      setTimeout(() => {
        firstResultRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }, 100);
    }
  }, [searchQuery, filteredSumulas]);

  // Infinite scroll handler
  useEffect(() => {
    const element = contentRef.current;
    if (!searchQuery && element) {
      const handleScroll = () => {
        if (!element) return;
        const scrollTop = element.scrollTop;
        const scrollHeight = element.scrollHeight;
        const clientHeight = element.clientHeight;
        if (scrollTop + clientHeight >= scrollHeight - 400 && displayLimit < filteredSumulas.length) {
          setDisplayLimit(prev => Math.min(prev + 50, filteredSumulas.length));
        }
      };
      element.addEventListener('scroll', handleScroll);
      return () => element.removeEventListener('scroll', handleScroll);
    }
  }, [displayLimit, filteredSumulas.length, searchQuery]);
  const increaseFontSize = () => {
    if (fontSize < 24) setFontSize(fontSize + 2);
  };
  const decreaseFontSize = () => {
    if (fontSize > 12) setFontSize(fontSize - 2);
  };
  const scrollToTop = () => {
    contentRef.current?.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };
  const handlePlayComment = (audioUrl: string, title: string) => {
    setCurrentAudio({
      url: audioUrl,
      title,
      isComment: true
    });
    setStickyPlayerOpen(true);
  };
  const handleOpenExplicacao = (artigo: string, numeroArtigo: string, tipo: "explicacao" | "exemplo", nivel?: "tecnico" | "simples") => {
    setModalData({
      artigo,
      numeroArtigo,
      tipo,
      nivel: nivel || "tecnico"
    });
    setModalOpen(true);
  };
  const handleGenerateFlashcards = async (artigo: string, numeroArtigo: string) => {
    setLoadingFlashcards(true);
    try {
      const response = await supabase.functions.invoke('gerar-flashcards', {
        body: {
          content: `Súmula ${numeroArtigo}\n${artigo}`
        }
      });
      if (response.error) throw response.error;
      setFlashcardsData(response.data.flashcards || []);
      setFlashcardsModalOpen(true);
    } catch (error) {
      console.error('Erro ao gerar flashcards:', error);
    } finally {
      setLoadingFlashcards(false);
    }
  };
  const handleShare = async (sumula: Sumula) => {
    const tipoTexto = id === 'cnmp' || id === 'cnj' ? 'Enunciado' : 'Súmula';
    const titulo = `${tipoTexto} ${sumula.id}`;
    const texto = sumula["Texto da Súmula"];
    const fullText = `${titulo}\n\n${texto}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: titulo,
          text: fullText
        });
      } catch (error) {
        console.error('Erro ao compartilhar:', error);
      }
    } else {
      // Fallback: copiar para clipboard
      try {
        await navigator.clipboard.writeText(fullText);
        toast({
          title: "Copiado!",
          description: "Texto copiado para a área de transferência"
        });
      } catch (error) {
        toast({
          title: "Erro",
          description: "Não foi possível copiar o texto",
          variant: "destructive"
        });
      }
    }
  };
  const handleAskQuestion = (sumula: Sumula) => {
    const tipoTexto = id === 'cnmp' || id === 'cnj' ? 'Enunciado' : 'Súmula';
    const text = `${tipoTexto} ${sumula.id}: ${sumula["Texto da Súmula"]}`;
    navigate(`/professora?contexto=${encodeURIComponent(text)}`);
  };
  return <div className="min-h-screen bg-background text-foreground">
      {/* Search Bar */}
      <BuscaCompacta
        value={searchInput}
        onChange={setSearchInput}
        onSearch={() => setSearchQuery(searchInput)}
        onClear={() => {
          setSearchInput("");
          setSearchQuery("");
        }}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        resultCount={filteredSumulas.length}
      />

      {/* Sticky Audio Player for Comments */}
      <StickyAudioPlayer isOpen={stickyPlayerOpen} onClose={() => setStickyPlayerOpen(false)} audioUrl={currentAudio.url} title={currentAudio.title} />

      {/* Explicacao Modal */}
      <ExplicacaoModal isOpen={modalOpen} onClose={() => setModalOpen(false)} artigo={modalData.artigo} numeroArtigo={modalData.numeroArtigo} tipo={modalData.tipo} nivel={modalData.nivel} />

      {/* Video Aula Modal */}
      <VideoAulaModal isOpen={videoModalOpen} onClose={() => setVideoModalOpen(false)} videoUrl={videoModalData.videoUrl} artigo={videoModalData.artigo} numeroArtigo={videoModalData.numeroArtigo} />

      {/* Termos Modal */}
      <TermosModal isOpen={termosModalOpen} onClose={() => setTermosModalOpen(false)} artigo={termosData.artigo} numeroArtigo={termosData.numeroArtigo} />

      {/* Questoes Modal */}
      <QuestoesModal isOpen={questoesModalOpen} onClose={() => setQuestoesModalOpen(false)} artigo={questoesData.artigo} numeroArtigo={questoesData.numeroArtigo} />

      {/* Flashcards Modal */}
      {flashcardsModalOpen && <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-lg font-bold text-accent">Flashcards</h2>
              <button onClick={() => setFlashcardsModalOpen(false)} className="p-2 hover:bg-secondary rounded-lg">
                <ArrowLeft className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <FlashcardViewer flashcards={flashcardsData} />
            </div>
          </div>
        </div>}

      {/* Content com Tabs */}
      <div ref={contentRef} className="overflow-y-auto h-[calc(100vh-180px)]">
        {/* Tab: Artigos */}
        {activeTab === 'artigos' && (
          <div className="px-4 max-w-4xl mx-auto py-4">
            {isLoading || isLoadingCache ? (
              <div className="space-y-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-card rounded-2xl p-6 border border-border">
                    <Skeleton className="h-8 w-32 mb-3" />
                    <Skeleton className="h-6 w-48 mb-4" />
                    <Skeleton className="h-24 w-full" />
                  </div>
                ))}
              </div>
            ) : displayedSumulas.length === 0 ? (
              <div className="text-center text-muted-foreground py-12">
                {searchQuery 
                  ? `Nenhum${id === 'cnmp' || id === 'cnj' ? ' enunciado encontrado' : 'a súmula encontrada'} para sua busca.` 
                  : `Nenhum${id === 'cnmp' || id === 'cnj' ? ' enunciado disponível' : 'a súmula disponível'}.`}
              </div>
            ) : (
              displayedSumulas.map((sumula, index) => {
                const isHighlighted = searchQuery && sumula.id?.toString() === searchQuery.trim();
                
                return (
                  <SumulaCard
                    key={sumula.id}
                    sumula={sumula}
                    index={index}
                    isHighlighted={isHighlighted}
                    isFirstResult={index === 0 && !!searchQuery}
                    firstResultRef={firstResultRef}
                    fontSize={fontSize}
                    categoryName={categoryName}
                    isCNMPorCNJ={id === 'cnmp' || id === 'cnj'}
                    tableName={tableName}
                    onOpenExplicacao={handleOpenExplicacao}
                    onGenerateFlashcards={handleGenerateFlashcards}
                    onOpenTermos={(artigo, numeroArtigo) => {
                      setTermosData({ artigo, numeroArtigo });
                      setTermosModalOpen(true);
                    }}
                    onOpenQuestoes={(artigo, numeroArtigo) => {
                      setQuestoesData({ artigo, numeroArtigo });
                      setQuestoesModalOpen(true);
                    }}
                    onShare={handleShare}
                    onPerguntar={handleAskQuestion}
                    loadingFlashcards={loadingFlashcards}
                  />
                );
              })
            )}
          </div>
        )}

        {/* Tab: Playlist */}
        {activeTab === 'playlist' && (
          <div className="p-4">
            <VadeMecumPlaylist 
              articles={sumulasComAudio.map(s => ({
                id: s.id,
                "Número do Artigo": s.id?.toString() || "",
                "Artigo": s["Texto da Súmula"] || "",
                "Narração": s["Narração"] || ""
              }))}
              codigoNome={categoryName}
            />
          </div>
        )}

        {/* Tab: Ranking (Em Alta) */}
        {activeTab === 'ranking' && (
          <div className="p-4">
            <VadeMecumRanking 
              tableName={tableName}
              codigoNome={categoryName}
              onArticleClick={(numeroArtigo) => {
                setSearchQuery(numeroArtigo);
                setSearchInput(numeroArtigo);
                setActiveTab('artigos');
              }}
            />
          </div>
        )}
      </div>

      {/* Tabs Navigation */}
      <VadeMecumTabs 
        activeTab={activeTab} 
        onTabChange={(tab) => setActiveTab(tab as any)}
      />

      {/* Floating Font Size Controls */}
      <div className="fixed bottom-28 left-4 flex flex-col gap-2 z-40 animate-fade-in">
        <Button onClick={increaseFontSize} size="icon" className="rounded-full bg-[hsl(45,93%,58%)] hover:bg-[hsl(45,93%,58%)]/90 text-black shadow-lg">
          <Plus className="w-4 h-4" />
        </Button>
        <Button onClick={decreaseFontSize} size="icon" className="rounded-full bg-[hsl(45,93%,58%)] hover:bg-[hsl(45,93%,58%)]/90 text-black shadow-lg">
          <Minus className="w-4 h-4" />
        </Button>
        <div className="bg-card border border-border text-foreground text-xs font-medium px-2 py-1.5 rounded-full text-center shadow-lg">
          {fontSize}px
        </div>
      </div>

      <Button
        onClick={scrollToTop}
        size="icon"
        className="fixed bottom-28 right-4 rounded-full bg-[hsl(45,93%,58%)] hover:bg-[hsl(45,93%,58%)]/90 text-black z-40 shadow-lg"
      >
        <ArrowUp className="w-5 h-5" />
      </Button>
    </div>;
};
export default SumulaView;