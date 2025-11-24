import { useNavigate } from "react-router-dom";
import { Crown, Gavel, FileText, BookText, Search, Scale, Info, Vote, Landmark, Shield, HandCoins, ScrollText } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ProposicoesRecentesCarousel from "@/components/ProposicoesRecentesCarousel";
import ProposicoesPlpCarousel from "@/components/ProposicoesPlpCarousel";
import LeisOrdinariasCarousel from "@/components/LeisOrdinariasCarousel";

const VadeMecumTodas = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const todasFuncionalidades = [
    {
      id: "constituicao",
      titulo: "Constituição Federal",
      descricao: "Acesse a Carta Magna brasileira",
      icon: Crown,
      route: "/constituicao"
    },
    {
      id: "codigos",
      titulo: "Códigos e Leis",
      descricao: "Explore toda legislação essencial",
      icon: Scale,
      route: "/codigos"
    },
    {
      id: "legislacao-penal",
      titulo: "Legislação Penal",
      descricao: "LEP, Drogas, Maria da Penha",
      icon: Shield,
      route: "/legislacao-penal-especial"
    },
    {
      id: "estatutos",
      titulo: "Estatutos",
      descricao: "Consulte estatutos especiais",
      icon: Gavel,
      route: "/estatutos"
    },
    {
      id: "previdenciario",
      titulo: "Previdenciário",
      descricao: "Leis de Benefícios e Custeio",
      icon: HandCoins,
      route: "/previdenciario"
    },
    {
      id: "sumulas",
      titulo: "Súmulas (STF/STJ)",
      descricao: "Súmulas vinculantes e ordinárias",
      icon: BookText,
      route: "/sumulas"
    },
    {
      id: "eleicoes",
      titulo: "Eleições (TSE)",
      descricao: "Dados e resultados eleitorais",
      icon: Vote,
      route: "#",
      disabled: true
    },
    {
      id: "camara",
      titulo: "Câmara dos Deputados",
      descricao: "Deputados e votações",
      icon: Landmark,
      route: "/camara-deputados"
    },
    {
      id: "leis-ordinarias",
      titulo: "Leis Ordinárias",
      descricao: "Legislação federal recente",
      icon: ScrollText,
      route: "#leis-ordinarias"
    }
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim().length >= 1) {
      navigate(`/vade-mecum/busca?q=${encodeURIComponent(searchQuery)}`);
    } else {
      toast.error("Digite pelo menos 1 caractere para pesquisar");
    }
  };

  return (
    <div className="px-4 py-6 space-y-6 pb-24">
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-foreground animate-fade-in">Vade Mecum Elite</h1>
        
        {/* Caixa de Pesquisa - Só aparece quando clicada */}
        {!isSearchFocused ? (
          <button
            onClick={() => setIsSearchFocused(true)}
            className="w-full flex items-center gap-3 px-4 py-3 bg-card/50 backdrop-blur-sm border border-accent/20 rounded-xl hover:border-accent transition-all text-left animate-fade-in"
          >
            <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" />
            <span className="text-muted-foreground text-sm">Pesquisar artigos, leis, súmulas...</span>
          </button>
        ) : (
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 animate-fade-in">
            <div className="flex-1 flex items-center gap-3 px-4 py-3 bg-card/50 backdrop-blur-sm border border-accent/20 rounded-xl focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20 transition-all">
              <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              <input
                type="text"
                placeholder="Pesquisar artigos, leis, súmulas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onBlur={() => {
                  if (!searchQuery) setIsSearchFocused(false);
                }}
                autoFocus
                className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground text-sm min-w-0"
              />
            </div>
            <button
              type="submit"
              disabled={searchQuery.trim().length < 1}
              className="px-6 py-3 bg-accent text-accent-foreground rounded-xl hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm whitespace-nowrap"
            >
              Pesquisar
            </button>
          </form>
        )}
      </div>
      
      {/* Grid de Funcionalidades - Estilo Vermelho */}
      <div className="space-y-3">
        <h2 className="text-xl font-bold text-foreground">Todas as Funcionalidades</h2>
        <p className="text-sm text-muted-foreground">Acesse rapidamente o que você precisa</p>
      </div>

      <div className="grid grid-cols-3 gap-3 md:gap-4">
        {todasFuncionalidades.map((func, index) => {
          const Icon = func.icon;
          return (
            <button
              key={func.id}
              onClick={() => {
                if (func.disabled) {
                  toast.info("Em breve! Esta funcionalidade está sendo desenvolvida.");
                } else if (func.route.startsWith('#')) {
                  // Scroll suave para a seção
                  const elemento = document.querySelector(func.route);
                  if (elemento) {
                    elemento.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                } else {
                  navigate(func.route);
                }
              }}
              className={`bg-gradient-to-br from-[hsl(0,75%,55%)] to-[hsl(350,70%,45%)] rounded-2xl p-5 text-left transition-all hover:scale-105 hover:shadow-2xl min-h-[160px] flex flex-col relative overflow-hidden shadow-xl animate-fade-in ${func.disabled ? 'opacity-70' : ''}`}
              style={{
                animationDelay: `${index * 0.05}s`,
                animationFillMode: 'backwards'
              }}
            >
              {func.disabled && (
                <div className="absolute top-2 right-2 bg-yellow-500 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full z-20">
                  Em breve
                </div>
              )}
              
              <div className="absolute inset-0 bg-gradient-to-tl from-black/60 via-black/30 to-transparent pointer-events-none" />
              
              <div className="bg-white/20 rounded-xl p-2.5 w-fit relative z-10 shadow-lg mb-3">
                <Icon className="w-6 h-6 text-white" />
              </div>
              
              <h3 className="text-lg font-bold text-white mb-2 relative z-10" 
                  style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.6)' }}>
                {func.titulo}
              </h3>
              
              <p className="text-white/80 text-xs line-clamp-2 relative z-10" 
                 style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.5)' }}>
                {func.descricao}
              </p>
            </button>
          );
        })}
      </div>

      {/* Leis Ordinárias - Carrossel */}
      <div id="leis-ordinarias" className="animate-fade-in" style={{ animationDelay: '0.5s', animationFillMode: 'backwards' }}>
        <LeisOrdinariasCarousel />
      </div>

      {/* Projetos de Lei Recentes (PL) */}
      <div className="animate-fade-in" style={{ animationDelay: '0.55s', animationFillMode: 'backwards' }}>
        <ProposicoesRecentesCarousel />
      </div>

      {/* Leis Complementares Recentes (PLP) */}
      <div className="animate-fade-in" style={{ animationDelay: '0.6s', animationFillMode: 'backwards' }}>
        <ProposicoesPlpCarousel />
      </div>

      {/* Card "Sobre o Vade Mecum" - Movido para baixo */}
      <Card className="bg-accent/5 border-accent/20">
        <CardContent className="p-6">
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <Scale className="w-5 h-5 text-accent" />
            Sobre o Vade Mecum
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            Sua ferramenta completa de consulta jurídica, reunindo toda a legislação brasileira essencial.
          </p>
          <Button 
            onClick={() => navigate("/vade-mecum/sobre")}
            variant="outline"
            className="w-full sm:w-auto gap-2"
          >
            <Info className="w-4 h-4" />
            Ver mais
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default VadeMecumTodas;
