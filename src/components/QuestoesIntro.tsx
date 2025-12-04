import { Button } from "@/components/ui/button";
import { Scale, CheckCircle2, Volume2, Image, BookOpen, MessageSquare } from "lucide-react";
import questoesCover from "@/assets/questoes-intro-cover.png";

interface QuestoesIntroProps {
  totalQuestoes: number;
  onAcessar: () => void;
}

export const QuestoesIntro = ({ totalQuestoes, onAcessar }: QuestoesIntroProps) => {
  const recursos = [
    { icon: Volume2, texto: "Narrações em áudio de todas as questões" },
    { icon: Image, texto: "Ilustrações explicativas em cada questão" },
    { icon: BookOpen, texto: "Exemplos práticos para fixação" },
    { icon: Scale, texto: "Questões organizadas por área e tema" },
    { icon: MessageSquare, texto: "Feedback detalhado das respostas" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 px-4 py-8 animate-fade-in">
      <div className="max-w-4xl mx-auto">
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-2xl animate-scale-in">
          {/* Capa */}
          <div className="relative h-[300px] md:h-[400px] overflow-hidden">
            <img 
              src={questoesCover} 
              alt="Questões por Tema" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
            <div className="absolute bottom-8 left-8 right-8">
              <h1 className="text-3xl md:text-5xl font-bold text-white mb-2">
                Questões por Tema
              </h1>
              <p className="text-white/90 text-lg md:text-xl font-medium bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg inline-block">
                📝 {totalQuestoes.toLocaleString('pt-BR')} questões disponíveis
              </p>
            </div>
          </div>

          {/* Botão Acessar */}
          <div className="p-6 md:p-8 pb-4">
            <Button 
              onClick={onAcessar} 
              size="lg" 
              className="w-full md:w-auto px-12 py-6 text-lg font-semibold bg-gradient-to-r from-purple-600 to-primary hover:from-purple-700 hover:to-primary/90 transform hover:scale-105 transition-all shadow-lg"
            >
              <Scale className="w-5 h-5 mr-2" />
              Acessar Questões
            </Button>
          </div>

          {/* Checklist de Recursos */}
          <div className="px-6 md:px-8 pb-8">
            <h2 className="text-xl md:text-2xl font-bold mb-4 flex items-center gap-2 text-purple-500">
              <CheckCircle2 className="w-6 h-6" />
              O que você encontra aqui
            </h2>
            
            <div className="space-y-3">
              {recursos.map((recurso, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-purple-600/20 text-purple-500">
                    <recurso.icon className="w-5 h-5" />
                  </div>
                  <span className="text-foreground font-medium">{recurso.texto}</span>
                </div>
              ))}
            </div>

            {/* Descrição */}
            <div className="mt-6 p-4 rounded-lg bg-gradient-to-r from-purple-600/10 to-primary/10 border border-purple-500/20">
              <p className="text-muted-foreground leading-relaxed">
                Estude de forma inteligente com nossas questões organizadas por área e tema do Direito. 
                Cada questão possui narração em áudio, ilustrações exclusivas e exemplos práticos 
                para facilitar seu aprendizado e fixação do conteúdo.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
