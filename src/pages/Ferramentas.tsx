import { useNavigate } from "react-router-dom";
import { MessageCircle, FileText, ArrowLeft, Newspaper, Sparkles, HelpCircle } from "lucide-react";
const Ferramentas = () => {
  const navigate = useNavigate();
  const ferramentas = [{
    id: "noticias",
    title: "Notícias Jurídicas",
    description: "Principais notícias do mundo jurídico",
    icon: Newspaper,
    route: "/noticias-juridicas"
  }, {
    id: "novidades",
    title: "Novidades",
    description: "Atualizações e melhorias do app",
    icon: Sparkles,
    route: "/novidades"
  }, {
    id: "assistente-ia",
    title: "Assistente IA",
    description: "Assistente jurídica 24/7 no WhatsApp",
    icon: MessageCircle,
    route: "/assistente-pessoal"
  }, {
    id: "modelos",
    title: "Modelos de Petições",
    description: "Mais de 30 mil modelos prontos",
    icon: FileText,
    route: "/advogado/modelos"
  }];
  return <div className="flex flex-col min-h-screen bg-background pb-6">
      <div className="flex-1 px-3 md:px-6 py-4 md:py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground">Ferramentas</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Todas as ferramentas úteis em um só lugar
            </p>
          </div>
        </div>

        {/* Lista de Ferramentas */}
        <div className="grid grid-cols-2 gap-3">
          {ferramentas.map(ferramenta => {
          const Icon = ferramenta.icon;
          return <button key={ferramenta.id} onClick={() => navigate(ferramenta.route)} className="bg-gradient-to-br from-[hsl(0,75%,55%)] to-[hsl(350,70%,45%)] rounded-xl p-4 text-left transition-all hover:scale-[1.02] hover:shadow-2xl flex items-center gap-4 relative overflow-hidden shadow-xl min-h-[88px]">
                <div className="absolute inset-0 bg-gradient-to-tl from-black/60 via-black/30 to-transparent pointer-events-none" />
                <div className="bg-white/20 rounded-lg p-3 relative z-10 shadow-lg">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 relative z-10">
                  <h3 className="text-base font-bold text-white mb-1 line-clamp-1" style={{
                textShadow: '2px 2px 4px rgba(0,0,0,0.6)'
              }}>
                    {ferramenta.title}
                  </h3>
                  <p className="text-white/80 text-sm line-clamp-2" style={{
                textShadow: '1px 1px 3px rgba(0,0,0,0.5)'
              }}>
                    {ferramenta.description}
                  </p>
                </div>
              </button>;
        })}
        </div>
      </div>
    </div>;
};
export default Ferramentas;