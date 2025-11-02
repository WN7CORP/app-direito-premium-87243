import { useNavigate } from "react-router-dom";
import { Shield, Scale, Heart, Skull, Zap, Phone, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const LegislacaoPenalEspecial = () => {
  const navigate = useNavigate();
  
  const leis = [
    {
      id: "lep",
      sigla: "LEP",
      titulo: "Lei de Execução Penal",
      numero: "Lei 7.210/1984",
      descricao: "Regula a execução das penas e medidas de segurança",
      icon: Shield,
      borderColor: "border-l-[hsl(24,95%,53%)]",
      iconBg: "bg-[hsl(24,95%,53%)]/10",
      iconColor: "text-[hsl(24,95%,53%)]",
      route: "/lei-penal/lep"
    },
    {
      id: "juizados",
      sigla: "JEC",
      titulo: "Juizados Especiais",
      numero: "Lei 9.099/1995",
      descricao: "Juizados Especiais Cíveis e Criminais",
      icon: Scale,
      borderColor: "border-l-[hsl(217,91%,60%)]",
      iconBg: "bg-[hsl(217,91%,60%)]/10",
      iconColor: "text-[hsl(217,91%,60%)]",
      route: "/lei-penal/juizados-especiais"
    },
    {
      id: "drogas",
      sigla: "LD",
      titulo: "Lei de Drogas",
      numero: "Lei 11.343/2006",
      descricao: "Sistema Nacional de Políticas sobre Drogas",
      icon: Shield,
      borderColor: "border-l-[hsl(160,84%,39%)]",
      iconBg: "bg-[hsl(160,84%,39%)]/10",
      iconColor: "text-[hsl(160,84%,39%)]",
      route: "/lei-penal/lei-drogas"
    },
    {
      id: "maria-penha",
      sigla: "LMP",
      titulo: "Maria da Penha",
      numero: "Lei 11.340/2006",
      descricao: "Proteção contra violência doméstica e familiar",
      icon: Heart,
      borderColor: "border-l-[hsl(330,81%,60%)]",
      iconBg: "bg-[hsl(330,81%,60%)]/10",
      iconColor: "text-[hsl(330,81%,60%)]",
      route: "/lei-penal/maria-da-penha"
    },
    {
      id: "hediondos",
      sigla: "LCH",
      titulo: "Crimes Hediondos",
      numero: "Lei 8.072/1990",
      descricao: "Define e regula os crimes hediondos",
      icon: Skull,
      borderColor: "border-l-[hsl(0,84%,60%)]",
      iconBg: "bg-[hsl(0,84%,60%)]/10",
      iconColor: "text-[hsl(0,84%,60%)]",
      route: "/lei-penal/crimes-hediondos"
    },
    {
      id: "tortura",
      sigla: "LT",
      titulo: "Lei de Tortura",
      numero: "Lei 9.455/1997",
      descricao: "Define os crimes de tortura",
      icon: Zap,
      borderColor: "border-l-[hsl(38,92%,50%)]",
      iconBg: "bg-[hsl(38,92%,50%)]/10",
      iconColor: "text-[hsl(38,92%,50%)]",
      route: "/lei-penal/tortura"
    },
    {
      id: "interceptacao",
      sigla: "LIT",
      titulo: "Interceptação Telefônica",
      numero: "Lei 9.296/1996",
      descricao: "Regulamenta a interceptação telefônica",
      icon: Phone,
      borderColor: "border-l-[hsl(262,83%,58%)]",
      iconBg: "bg-[hsl(262,83%,58%)]/10",
      iconColor: "text-[hsl(262,83%,58%)]",
      route: "/lei-penal/interceptacao-telefonica"
    },
    {
      id: "org-criminosas",
      sigla: "LOC",
      titulo: "Organizações Criminosas",
      numero: "Lei 12.850/2013",
      descricao: "Define organização criminosa e investiga��ão",
      icon: Users,
      borderColor: "border-l-[hsl(271,76%,53%)]",
      iconBg: "bg-[hsl(271,76%,53%)]/10",
      iconColor: "text-[hsl(271,76%,53%)]",
      route: "/lei-penal/organizacoes-criminosas"
    }
  ];

  const getGlowColor = (id: string) => {
    const colorMap: Record<string, string> = {
      "lep": "hsl(24,95%,53%)",
      "juizados": "hsl(217,91%,60%)",
      "drogas": "hsl(160,84%,39%)",
      "maria-penha": "hsl(330,81%,60%)",
      "hediondos": "hsl(0,84%,60%)",
      "tortura": "hsl(38,92%,50%)",
      "interceptacao": "hsl(262,83%,58%)",
      "org-criminosas": "hsl(271,76%,53%)"
    };
    return colorMap[id] || "hsl(217,91%,60%)";
  };

  return (
    <div className="px-3 py-4 max-w-4xl mx-auto pb-24">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-600 shadow-lg shadow-red-500/50">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold">Legislação Penal Especial</h1>
            <p className="text-sm text-muted-foreground">
              Leis penais especiais e complementares
            </p>
          </div>
        </div>
      </div>

      {/* Leis Grid */}
      <div className="grid grid-cols-2 gap-3">
        {leis.map((lei) => {
          const Icon = lei.icon;
          return (
            <Card
              key={lei.id}
              className="cursor-pointer hover:scale-105 hover:shadow-xl hover:-translate-y-1 transition-all border-2 border-transparent hover:border-primary/50 bg-gradient-to-br from-card to-card/80 group overflow-hidden relative"
              onClick={() => navigate(lei.route)}
            >
              <div 
                className="absolute top-0 left-0 right-0 h-1 opacity-80"
                style={{
                  background: `linear-gradient(90deg, transparent, ${getGlowColor(lei.id)}, transparent)`,
                  boxShadow: `0 0 20px ${getGlowColor(lei.id)}`
                }}
              />
              
              <CardContent className="p-4 flex flex-col items-center text-center min-h-[160px] justify-center">
                <div className={`${lei.iconBg} rounded-full p-3 mb-2`}>
                  <Icon className={`w-6 h-6 ${lei.iconColor}`} />
                </div>
                <h3 className="font-bold text-sm mb-1">{lei.sigla}</h3>
                <p className="text-xs font-semibold text-muted-foreground mb-1">
                  {lei.titulo}
                </p>
                <p className="text-[10px] text-muted-foreground line-clamp-2">
                  {lei.descricao}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default LegislacaoPenalEspecial;
