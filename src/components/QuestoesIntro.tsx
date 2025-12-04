import { Button } from "@/components/ui/button";
import { Scale, CheckCircle2, Volume2, Image, BookOpen, MessageSquare } from "lucide-react";
import questoesCover from "@/assets/questoes-intro-cover.png";

interface QuestoesIntroProps {
  totalQuestoes: number;
  onAcessar: () => void;
}

export const QuestoesIntro = ({ totalQuestoes, onAcessar }: QuestoesIntroProps) => {
  const recursos = [
    { icon: Volume2, texto: "Narrações em áudio" },
    { icon: Image, texto: "Ilustrações explicativas" },
    { icon: BookOpen, texto: "Exemplos práticos" },
    { icon: Scale, texto: "Organizadas por tema" },
    { icon: MessageSquare, texto: "Feedback detalhado" },
  ];

  return (
    <div className="px-3 py-4 animate-fade-in">
      <div className="max-w-lg mx-auto">
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xl">
          {/* Capa */}
          <div className="relative h-[280px] overflow-hidden">
            <img 
              src={questoesCover} 
              alt="Questões por Tema" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            <div className="absolute bottom-5 left-5 right-5">
              <h1 className="text-3xl font-bold text-white mb-2">
                Questões por Tema
              </h1>
              <p className="text-white/90 text-base font-medium bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg inline-block">
                📝 {totalQuestoes.toLocaleString('pt-BR')} questões disponíveis
              </p>
            </div>
          </div>

          {/* Botão Acessar */}
          <div className="p-5">
            <Button 
              onClick={onAcessar} 
              size="lg" 
              className="w-full py-6 text-lg font-semibold bg-gradient-to-r from-purple-600 to-primary hover:from-purple-700 hover:to-primary/90 transition-all shadow-lg"
            >
              <Scale className="w-5 h-5 mr-2" />
              Acessar Questões
            </Button>
          </div>

          {/* Checklist de Recursos */}
          <div className="px-5 pb-6">
            <h2 className="text-base font-bold mb-3 flex items-center gap-2 text-purple-500">
              <CheckCircle2 className="w-5 h-5" />
              O que você encontra aqui
            </h2>
            
            <div className="grid grid-cols-2 gap-3">
              {recursos.map((recurso, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-3 p-3 rounded-lg bg-secondary/40"
                >
                  <recurso.icon className="w-5 h-5 text-purple-500 flex-shrink-0" />
                  <span className="text-foreground text-sm">{recurso.texto}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
