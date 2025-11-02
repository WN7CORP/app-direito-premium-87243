import { useState, useMemo, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Search, Volume2, BookOpen, Video, FileText, HelpCircle, ListChecks, Loader2, TrendingUp } from "lucide-react";
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

interface Article {
  id: number;
  "Número do Artigo": string | null;
  "Artigo": string | null;
  "Narração": string | null;
  "Comentario": string | null;
  "Aula": string | null;
}

const MariaDaPenhaView = () => {
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
      {/* Tabs */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <VadeMecumTabs activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      {activeTab === "artigos" && (
        <>
          {/* Search Bar */}
          <div className="sticky top-[52px] z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b px-3 py-2">
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
              <Button size="icon" variant="outline">
                <Search className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Articles List */}
          <div className="px-3 py-4 max-w-4xl mx-auto">
            <div className="mb-4">
              <h1 className="text-2xl font-bold">Lei Maria da Penha</h1>
              <p className="text-sm text-muted-foreground">Lei 11.340/2006 - {articles?.length || 0} artigos</p>
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

  return (
    <div 
      ref={elementRef}
      className="border rounded-lg p-4 bg-card hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="font-bold text-primary">{article["Número do Artigo"]}</h3>
        </div>
        {article["Narração"] && (
          <Button
            size="sm"
            variant={isPlayingAudio ? "default" : "ghost"}
            onClick={() => onPlayAudio(article["Narração"]!)}
          >
            <Volume2 className="w-4 h-4" />
          </Button>
        )}
      </div>

      <p className="text-sm text-muted-foreground mb-4 whitespace-pre-line">
        {article["Artigo"]}
      </p>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={onExplicar}>
          <BookOpen className="w-3 h-3 mr-1" />
          Explicar
        </Button>
        
        {article["Aula"] && (
          <Button size="sm" variant="outline" onClick={onVideoAula}>
            <Video className="w-3 h-3 mr-1" />
            Videoaula
          </Button>
        )}

        <Button size="sm" variant="outline" onClick={onTermos}>
          <FileText className="w-3 h-3 mr-1" />
          Termos
        </Button>

        <Button size="sm" variant="outline" onClick={onQuestoes}>
          <ListChecks className="w-3 h-3 mr-1" />
          Questões
        </Button>

        <Button size="sm" variant="outline" onClick={onFlashcards}>
          <TrendingUp className="w-3 h-3 mr-1" />
          Flashcards
        </Button>

        <Button size="sm" variant="outline" onClick={onPergunta}>
          <HelpCircle className="w-3 h-3 mr-1" />
          Perguntar
        </Button>
      </div>
    </div>
  );
};

export default MariaDaPenhaView;
