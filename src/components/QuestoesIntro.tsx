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
    <div className="px-4 py-6 animate-fade-in">
      <div className="max-w-md mx-auto">
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xl">
          {/* Capa compacta */}
          <div className="relative h-[200px] overflow-hidden">
            <img 
              src={questoesCover} 
              alt="Questões por Tema" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4">
              <h1 className="text-2xl font-bold text-white mb-1">
                Questões por Tema
              </h1>
              <p className="text-white/90 text-sm font-medium bg-white/10 backdrop-blur-sm px-3 py-1 rounded-lg inline-block">
                📝 {totalQuestoes.toLocaleString('pt-BR')} questões disponíveis
              </p>
            </div>
          </div>

          {/* Botão Acessar */}
          <div className="p-4">
            <Button 
              onClick={onAcessar} 
              size="lg" 
              className="w-full py-5 text-base font-semibold bg-gradient-to-r from-purple-600 to-primary hover:from-purple-700 hover:to-primary/90 transition-all shadow-lg"
            >
              <Scale className="w-5 h-5 mr-2" />
              Acessar Questões
            </Button>
          </div>

          {/* Checklist de Recursos - Compacto */}
          <div className="px-4 pb-4">
            <h2 className="text-sm font-bold mb-2 flex items-center gap-2 text-purple-500">
              <CheckCircle2 className="w-4 h-4" />
              O que você encontra aqui
            </h2>
            
            <div className="grid grid-cols-2 gap-2">
              {recursos.map((recurso, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-2 p-2 rounded-lg bg-secondary/30 text-sm"
                >
                  <recurso.icon className="w-4 h-4 text-purple-500 flex-shrink-0" />
                  <span className="text-foreground text-xs">{recurso.texto}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
