import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Search, Volume2, BookOpen, Video, FileText, HelpCircle, ListChecks, TrendingUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import ExplicacaoModal from "@/components/ExplicacaoModal";
import VideoAulaModal from "@/components/VideoAulaModal";
import TermosModal from "@/components/TermosModal";
import QuestoesModal from "@/components/QuestoesModal";
import PerguntaModal from "@/components/PerguntaModal";
import { FlashcardViewer } from "@/components/FlashcardViewer";
import StickyAudioPlayer from "@/components/StickyAudioPlayer";
import { VadeMecumTabs } from "@/components/VadeMecumTabs";
import { VadeMecumPlaylist } from "@/components/VadeMecumPlaylist";
import { VadeMecumRanking } from "@/components/VadeMecumRanking";
import { useArticleTracking } from "@/hooks/useArticleTracking";
import { ArtigoActionsMenu } from "@/components/ArtigoActionsMenu";
import { formatForWhatsApp } from "@/lib/formatWhatsApp";

interface Article {
  id: number;
  "Número do Artigo": string | null;
  "Artigo": string | null;
  "Narração": string | null;
  "Comentario": string | null;
  "Aula": string | null;
}

const MariaDaPenhaView = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [displayLimit, setDisplayLimit] = useState(10);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [showExplicacao, setShowExplicacao] = useState(false);
  const [showVideoAula, setShowVideoAula] = useState(false);
  const [showTermos, setShowTermos] = useState(false);
  const [showQuestoes, setShowQuestoes] = useState(false);
  const [showPergunta, setShowPergunta] = useState(false);
  const [showFlashcards, setShowFlashcards] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<string | null>(null);
  const [currentArticleNumber, setCurrentArticleNumber] = useState<string>("");
  const [activeTab, setActiveTab] = useState("artigos");
  const searchResultRef = useRef<HTMLDivElement>(null);

  const { data: articles, isLoading } = useQuery({
    queryKey: ["maria-da-penha-articles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("Lei 11.340/2006 - Maria da Penha")
        .select("*")
        .order("id", { ascending: true });

      if (error) throw error;
      return data as Article[];
    },
  });

  const filteredArticles = useMemo(() => {
    if (!articles) return [];
    if (!searchQuery.trim()) return articles;
    
    const query = searchQuery.toLowerCase();
    return articles.filter(article => 
      article["Número do Artigo"]?.toLowerCase().includes(query) ||
      article["Artigo"]?.toLowerCase().includes(query)
    );
  }, [articles, searchQuery]);

  const displayedArticles = searchQuery.trim() 
    ? filteredArticles 
    : filteredArticles.slice(0, displayLimit);

  const articlesWithAudio = useMemo(() => {
    return articles?.filter(article => article["Narração"]) || [];
  }, [articles]);

  const handleGenerateFlashcards = async (articleNumber: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("gerar-flashcards", {
        body: { 
          tableName: "Lei 11.340/2006 - Maria da Penha",
          articleNumber 
        }
      });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Erro ao gerar flashcards:", error);
      throw error;
    }
  };

  useEffect(() => {
    if (searchQuery.trim() && searchResultRef.current) {
      searchResultRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [searchQuery]);

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="flex items-center gap-3 px-3 py-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/lei-penal")}
            className="shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-bold truncate">Lei Maria da Penha</h1>
            <p className="text-xs text-muted-foreground truncate">Lei 11.340/2006</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-[61px] z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <VadeMecumTabs activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      {activeTab === "artigos" && (
        <>
          {/* Search Bar */}
          <div className="sticky top-[113px] z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b px-3 py-2">
            <div className="flex gap-2 max-w-4xl mx-auto">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Buscar artigo..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button size="icon" variant="outline" onClick={() => setSearchQuery(searchQuery)}>
                <Search className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Articles List */}
          <div className="px-3 py-4 max-w-4xl mx-auto">
            <div className="mb-4">
              <p className="text-sm text-muted-foreground">
                {searchQuery.trim() 
                  ? `${filteredArticles.length} resultado(s) encontrado(s)`
                  : `${articles?.length || 0} artigos`
                }
              </p>
            </div>

            {isLoading && (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-32 w-full" />
                ))}
              </div>
            )}

            {!isLoading && displayedArticles.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Nenhum artigo encontrado</p>
              </div>
            )}

            <div className="space-y-4" ref={searchResultRef}>
              {displayedArticles.map((article) => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  onExplicar={() => {
                    setSelectedArticle(article);
                    setShowExplicacao(true);
                  }}
                  onVideoAula={() => {
                    setSelectedArticle(article);
                    setShowVideoAula(true);
                  }}
                  onTermos={() => {
                    setSelectedArticle(article);
                    setShowTermos(true);
                  }}
                  onQuestoes={() => {
                    setSelectedArticle(article);
                    setShowQuestoes(true);
                  }}
                  onPergunta={() => {
                    setSelectedArticle(article);
                    setShowPergunta(true);
                  }}
                  onFlashcards={() => {
                    setSelectedArticle(article);
                    setCurrentArticleNumber(article["Número do Artigo"] || "");
                    setShowFlashcards(true);
                  }}
                  onPlayAudio={(audioUrl) => {
                    setCurrentAudio(audioUrl);
                    setCurrentArticleNumber(article["Número do Artigo"] || "");
                  }}
                  isPlayingAudio={currentAudio === article["Narração"]}
                />
              ))}
            </div>

            {!searchQuery.trim() && displayedArticles.length < filteredArticles.length && (
              <div className="text-center mt-6">
                <Button
                  onClick={() => setDisplayLimit(prev => prev + 10)}
                  variant="outline"
                >
                  Ver mais artigos
                </Button>
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === "playlist" && (
        <VadeMecumPlaylist
          articles={articlesWithAudio}
          codigoNome="Lei Maria da Penha"
        />
      )}

      {activeTab === "ranking" && (
        <VadeMecumRanking 
          tableName="Lei 11.340/2006 - Maria da Penha" 
          codigoNome="Lei Maria da Penha"
          onArticleClick={(numeroArtigo) => {
            setSearchQuery(numeroArtigo);
            setActiveTab("artigos");
          }}
        />
      )}

      {/* Audio Player */}
      <StickyAudioPlayer
        isOpen={!!currentAudio}
        onClose={() => setCurrentAudio(null)}
        audioUrl={currentAudio || ""}
        title={currentArticleNumber}
      />

      {/* Modals */}
      <ExplicacaoModal
        isOpen={showExplicacao}
        onClose={() => setShowExplicacao(false)}
        artigo={selectedArticle?.["Artigo"] || ""}
        numeroArtigo={selectedArticle?.["Número do Artigo"] || ""}
        tipo="explicacao"
        nivel="tecnico"
      />

      <VideoAulaModal
        isOpen={showVideoAula}
        onClose={() => setShowVideoAula(false)}
        videoUrl={selectedArticle?.["Aula"] || ""}
        artigo={selectedArticle?.["Artigo"] || ""}
        numeroArtigo={selectedArticle?.["Número do Artigo"] || ""}
      />

      <TermosModal
        isOpen={showTermos}
        onClose={() => setShowTermos(false)}
        artigo={selectedArticle?.["Artigo"] || ""}
        numeroArtigo={selectedArticle?.["Número do Artigo"] || ""}
      />

      <QuestoesModal
        isOpen={showQuestoes}
        onClose={() => setShowQuestoes(false)}
        artigo={selectedArticle?.["Artigo"] || ""}
        numeroArtigo={selectedArticle?.["Número do Artigo"] || ""}
      />

      <PerguntaModal
        isOpen={showPergunta}
        onClose={() => setShowPergunta(false)}
        artigo={selectedArticle?.["Artigo"] || ""}
        numeroArtigo={selectedArticle?.["Número do Artigo"] || ""}
      />
    </div>
  );
};

interface ArticleCardProps {
  article: Article;
  onExplicar: () => void;
  onVideoAula: () => void;
  onTermos: () => void;
  onQuestoes: () => void;
  onPergunta: () => void;
  onFlashcards: () => void;
  onPlayAudio: (audioUrl: string) => void;
  isPlayingAudio: boolean;
}

const ArticleCard = ({ 
  article, 
  onExplicar, 
  onVideoAula, 
  onTermos, 
  onQuestoes, 
  onPergunta,
  onFlashcards,
  onPlayAudio,
  isPlayingAudio
}: ArticleCardProps) => {
  const { elementRef } = useArticleTracking({
    tableName: "Lei 11.340/2006 - Maria da Penha",
    articleId: article.id,
    numeroArtigo: article["Número do Artigo"] || "",
    enabled: true
  });

  const articleText = article["Artigo"] || "";
  const isTitle = !article["Número do Artigo"];

  if (isTitle) {
    return (
      <div className="mb-6">
        <div className="border-l-4 border-primary pl-4 py-2">
          <h2 className="text-lg font-bold text-primary whitespace-pre-line">
            {articleText}
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={elementRef}
      className="border rounded-lg p-4 bg-card hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            {article["Número do Artigo"] && (
              <h3 className="font-bold text-primary shrink-0">
                Art. {article["Número do Artigo"]}
              </h3>
            )}
            {article["Narração"] && (
              <Button
                size="sm"
                variant={isPlayingAudio ? "default" : "ghost"}
                onClick={() => onPlayAudio(article["Narração"]!)}
                className="shrink-0"
              >
                <Volume2 className="w-4 h-4" />
              </Button>
            )}
          </div>
          <p className="text-sm text-muted-foreground whitespace-pre-line">
            {articleText}
          </p>
        </div>
      </div>

      <ArtigoActionsMenu
        article={article}
        onOpenExplicacao={(tipo) => onExplicar()}
        onOpenAula={article["Aula"] ? onVideoAula : undefined}
        onOpenTermos={onTermos}
        onOpenQuestoes={onQuestoes}
        onGenerateFlashcards={onFlashcards}
        onPerguntar={onPergunta}
        onShareWhatsApp={() => {
          const text = formatForWhatsApp(
            `*Lei Maria da Penha - Lei 11.340/2006*\n\n*Art. ${article["Número do Artigo"]}*\n\n${articleText}`
          );
          if (navigator.share) {
            navigator.share({ text });
          } else {
            navigator.clipboard.writeText(text);
          }
        }}
      />
    </div>
  );
};

export default MariaDaPenhaView;
