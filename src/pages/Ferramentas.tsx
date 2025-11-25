import { useNavigate } from "react-router-dom";
import { MessageCircle, FileText, Newspaper, Sparkles, Film, GraduationCap, BookOpen } from "lucide-react";
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
    description: "Assistente jurídica disponível 24 horas por dia no WhatsApp",
    icon: MessageCircle,
    route: "/assistente-pessoal"
  }, {
    id: "modelos",
    title: "Modelos de Petições",
    description: "Mais de 30 mil modelos prontos para uso",
    icon: FileText,
    route: "/advogado/modelos"
  }, {
    id: "juriflix",
    title: "JuriFlix",
    description: "Filmes e séries jurídicas para assistir",
    icon: Film,
    route: "/juriflix"
  }, {
    id: "ranking-faculdades",
    title: "Ranking de Faculdades",
    description: "Ranking completo das melhores faculdades de Direito",
    icon: GraduationCap,
    route: "/ranking-faculdades"
  }, {
    id: "dicionario",
    title: "Dicionário Jurídico",
    description: "Consulte termos e definições jurídicas",
    icon: BookOpen,
    route: "/dicionario"
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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {ferramentas.map(ferramenta => {
          const Icon = ferramenta.icon;
          return <button key={ferramenta.id} onClick={() => navigate(ferramenta.route)} className="bg-gradient-to-br from-[hsl(0,75%,55%)] to-[hsl(350,70%,45%)] rounded-xl p-4 text-left transition-all hover:scale-[1.02] hover:shadow-2xl flex flex-col gap-3 relative overflow-hidden shadow-xl min-h-[130px]">
                <div className="absolute inset-0 bg-gradient-to-tl from-black/60 via-black/30 to-transparent pointer-events-none" />
                <div className="bg-white/20 rounded-lg p-3 relative z-10 shadow-lg w-fit">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 relative z-10">
                  <h3 className="text-base font-bold text-white mb-1" style={{
                textShadow: '2px 2px 4px rgba(0,0,0,0.6)'
              }}>
                    {ferramenta.title}
                  </h3>
                  <p className="text-white/80 text-sm" style={{
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