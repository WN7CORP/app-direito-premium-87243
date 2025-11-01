import { 
  Volume2, 
  MessageSquare, 
  GraduationCap, 
  Lightbulb, 
  BookOpen, 
  Bookmark, 
  BookMarked, 
  FileQuestion, 
  Sparkles,
  ChevronDown,
  Share2
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface Article {
  "Número do Artigo": string | null;
  "Artigo": string | null;
  "Narração": string | null;
  "Comentario": string | null;
  "Aula": string | null;
}

interface ArtigoActionsMenuProps {
  article: Article;
  onPlayNarration?: (audioUrl: string) => void;
  onPlayComment?: (audioUrl: string, title: string) => void;
  onOpenAula?: () => void;
  onOpenExplicacao?: (tipo: "explicacao" | "exemplo") => void;
  onGenerateFlashcards?: () => void;
  onOpenTermos?: () => void;
  onOpenQuestoes?: () => void;
  onPerguntar?: () => void;
  onShareWhatsApp?: () => void;
  loadingFlashcards?: boolean;
  isCommentPlaying?: boolean;
}

export const ArtigoActionsMenu = ({
  article,
  onPlayNarration,
  onPlayComment,
  onOpenAula,
  onOpenExplicacao,
  onGenerateFlashcards,
  onOpenTermos,
  onOpenQuestoes,
  onPerguntar,
  onShareWhatsApp,
  loadingFlashcards = false,
  isCommentPlaying = false,
}: ArtigoActionsMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const hasAula = article["Aula"];

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button 
          variant="outline"
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-accent/10 to-accent/20 hover:from-accent/20 hover:to-accent/30 text-foreground border-accent/40 font-semibold transition-all shadow-md hover:shadow-lg data-[state=open]:shadow-xl data-[state=open]:border-accent/60"
        >
          <Sparkles className="w-5 h-5 text-accent-foreground" />
          <span className="text-base">Recursos do Artigo</span>
          <ChevronDown className={`w-5 h-5 ml-auto transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
        </Button>
      </CollapsibleTrigger>
      
      <CollapsibleContent className="overflow-hidden transition-all duration-300">
        <div className="pt-4 grid grid-cols-2 gap-3 animate-fade-in">
          {/* Explicar */}
          {onOpenExplicacao && (
            <button
              onClick={() => onOpenExplicacao("explicacao")}
              className="flex flex-col items-center justify-center gap-2 px-4 py-4 bg-gradient-to-br from-yellow-500/10 to-yellow-600/20 hover:from-yellow-500/20 hover:to-yellow-600/30 text-foreground rounded-xl transition-all duration-200 text-sm font-semibold hover:scale-105 animate-fade-in border border-yellow-500/30 shadow-sm hover:shadow-md"
              style={{ animationDelay: '0ms' }}
            >
              <Lightbulb className="w-6 h-6 text-yellow-600" />
              <span>Explicar</span>
            </button>
          )}

          {/* Exemplo */}
          {onOpenExplicacao && (
            <button
              onClick={() => onOpenExplicacao("exemplo")}
              className="flex flex-col items-center justify-center gap-2 px-4 py-4 bg-gradient-to-br from-blue-500/10 to-blue-600/20 hover:from-blue-500/20 hover:to-blue-600/30 text-foreground rounded-xl transition-all duration-200 text-sm font-semibold hover:scale-105 animate-fade-in border border-blue-500/30 shadow-sm hover:shadow-md"
              style={{ animationDelay: '30ms' }}
            >
              <BookOpen className="w-6 h-6 text-blue-600" />
              <span>Exemplo</span>
            </button>
          )}

          {/* Termos */}
          {onOpenTermos && (
            <button
              onClick={onOpenTermos}
              className="flex flex-col items-center justify-center gap-2 px-4 py-4 bg-gradient-to-br from-purple-500/10 to-purple-600/20 hover:from-purple-500/20 hover:to-purple-600/30 text-foreground rounded-xl transition-all duration-200 text-sm font-semibold hover:scale-105 animate-fade-in border border-purple-500/30 shadow-sm hover:shadow-md"
              style={{ animationDelay: '60ms' }}
            >
              <BookMarked className="w-6 h-6 text-purple-600" />
              <span>Termos</span>
            </button>
          )}

          {/* Questões */}
          {onOpenQuestoes && (
            <button
              onClick={onOpenQuestoes}
              className="flex flex-col items-center justify-center gap-2 px-4 py-4 bg-gradient-to-br from-green-500/10 to-green-600/20 hover:from-green-500/20 hover:to-green-600/30 text-foreground rounded-xl transition-all duration-200 text-sm font-semibold hover:scale-105 animate-fade-in border border-green-500/30 shadow-sm hover:shadow-md"
              style={{ animationDelay: '90ms' }}
            >
              <FileQuestion className="w-6 h-6 text-green-600" />
              <span>Questões</span>
            </button>
          )}

          {/* Flashcards */}
          {onGenerateFlashcards && (
            <button
              onClick={onGenerateFlashcards}
              disabled={loadingFlashcards}
              className="flex flex-col items-center justify-center gap-2 px-4 py-4 bg-gradient-to-br from-pink-500/10 to-pink-600/20 hover:from-pink-500/20 hover:to-pink-600/30 text-foreground rounded-xl transition-all duration-200 text-sm font-semibold hover:scale-105 animate-fade-in border border-pink-500/30 shadow-sm hover:shadow-md disabled:opacity-50 disabled:hover:scale-100"
              style={{ animationDelay: '120ms' }}
            >
              <Bookmark className="w-6 h-6 text-pink-600" />
              <span>{loadingFlashcards ? "Gerando..." : "Flashcards"}</span>
            </button>
          )}

          {/* Comentário */}
          {article["Comentario"] && onPlayComment && (
            <button
              onClick={() => onPlayComment(
                article["Comentario"]!,
                `Comentário - Art. ${article["Número do Artigo"]}`
              )}
              className="flex flex-col items-center justify-center gap-2 px-4 py-4 bg-gradient-to-br from-cyan-500/10 to-cyan-600/20 hover:from-cyan-500/20 hover:to-cyan-600/30 text-foreground rounded-xl transition-all duration-200 text-sm font-semibold hover:scale-105 animate-fade-in border border-cyan-500/30 shadow-sm hover:shadow-md"
              style={{ animationDelay: '150ms' }}
            >
              <MessageSquare className="w-6 h-6 text-cyan-600" />
              <span>Comentário</span>
            </button>
          )}

          {/* Aula (se disponível) */}
          {hasAula && onOpenAula && (
            <button
              onClick={onOpenAula}
              className="flex flex-col items-center justify-center gap-2 px-4 py-4 bg-gradient-to-br from-indigo-500/10 to-indigo-600/20 hover:from-indigo-500/20 hover:to-indigo-600/30 text-foreground rounded-xl transition-all duration-200 text-sm font-semibold hover:scale-105 animate-fade-in border border-indigo-500/30 shadow-sm hover:shadow-md"
              style={{ animationDelay: '180ms' }}
            >
              <GraduationCap className="w-6 h-6 text-indigo-600" />
              <span>Aula</span>
            </button>
          )}

          {/* Perguntar */}
          {onPerguntar && (
            <button
              onClick={onPerguntar}
              className="flex flex-col items-center justify-center gap-2 px-4 py-4 bg-gradient-to-br from-orange-500/10 to-orange-600/20 hover:from-orange-500/20 hover:to-orange-600/30 text-foreground rounded-xl transition-all duration-200 text-sm font-semibold hover:scale-105 animate-fade-in border border-orange-500/30 shadow-sm hover:shadow-md"
              style={{ animationDelay: '210ms' }}
            >
              <MessageSquare className="w-6 h-6 text-orange-600" />
              <span>Perguntar</span>
            </button>
          )}

          {/* WhatsApp - último */}
          {onShareWhatsApp && (
            <button
              onClick={onShareWhatsApp}
              className="flex flex-col items-center justify-center gap-2 px-4 py-4 bg-gradient-to-br from-emerald-500/10 to-emerald-600/20 hover:from-emerald-500/20 hover:to-emerald-600/30 text-foreground rounded-xl transition-all duration-200 text-sm font-semibold hover:scale-105 animate-fade-in border border-emerald-500/30 shadow-sm hover:shadow-md"
              style={{ animationDelay: '240ms' }}
            >
              <Share2 className="w-6 h-6 text-emerald-600" />
              <span>WhatsApp</span>
            </button>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};
