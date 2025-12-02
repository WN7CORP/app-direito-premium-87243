import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, BookOpen, Scale } from "lucide-react";

const FlashcardsEscolha = () => {
  const navigate = useNavigate();

  const opcoes = [
    {
      id: "areas",
      title: "Áreas do Direito",
      description: "Estude flashcards organizados por área do direito",
      icon: BookOpen,
      route: "/flashcards/areas",
      color: "rgb(139, 92, 246)",
      emoji: "📚"
    },
    {
      id: "artigos",
      title: "Artigos da Lei",
      description: "Estude flashcards de artigos específicos da lei",
      icon: Scale,
      route: "/flashcards/artigos-lei",
      color: "rgb(16, 185, 129)",
      emoji: "⚖️"
    }
  ];

  return (
    <div className="px-3 py-4 max-w-4xl mx-auto pb-24">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-purple-600 shadow-lg shadow-purple-500/50">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold">Flashcards</h1>
            <p className="text-sm text-muted-foreground">
              Escolha como deseja estudar
            </p>
          </div>
        </div>
      </div>

      {/* Opções */}
      <div className="grid gap-4">
        {opcoes.map((opcao) => (
          <Card
            key={opcao.id}
            className="cursor-pointer hover:scale-[1.02] hover:shadow-xl transition-all border-2 border-transparent hover:border-primary/50 bg-gradient-to-br from-card to-card/80 group overflow-hidden relative"
            onClick={() => navigate(opcao.route)}
          >
            <div 
              className="absolute top-0 left-0 right-0 h-1.5 opacity-80"
              style={{
                background: `linear-gradient(90deg, transparent, ${opcao.color}, transparent)`,
                boxShadow: `0 0 20px ${opcao.color}`
              }}
            />
            
            <CardContent className="p-6 flex items-center gap-4">
              <div 
                className="flex items-center justify-center w-16 h-16 rounded-2xl text-4xl"
                style={{ backgroundColor: `${opcao.color}20` }}
              >
                {opcao.emoji}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg mb-1">{opcao.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {opcao.description}
                </p>
              </div>
              <opcao.icon className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default FlashcardsEscolha;
