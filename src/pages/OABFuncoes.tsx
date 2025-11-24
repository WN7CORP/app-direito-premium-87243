import { useNavigate } from "react-router-dom";
import { Library, Video, Target, BookOpen, Gavel, ArrowLeft } from "lucide-react";

const OABFuncoes = () => {
  const navigate = useNavigate();

  const funcoes = [
    {
      id: "biblioteca-oab",
      title: "Biblioteca OAB",
      description: "Acesse materiais de estudo para OAB",
      icon: Library,
      route: "/biblioteca-oab"
    },
    {
      id: "videoaulas-oab",
      title: "Videoaulas OAB",
      description: "Assista aulas preparatórias",
      icon: Video,
      route: "/videoaulas-oab"
    },
    {
      id: "simulados-oab",
      title: "Simulados OAB",
      description: "Pratique com simulados completos",
      icon: Target,
      route: "/simulados/exames"
    },
    {
      id: "o-que-estudar-oab",
      title: "O que estudar para OAB",
      description: "Guia completo de conteúdos",
      icon: BookOpen,
      route: "/oab/o-que-estudar"
    },
    {
      id: "questoes-oab",
      title: "Questões OAB",
      description: "Resolva questões de provas anteriores",
      icon: Gavel,
      route: "/simulados/personalizado"
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20 md:pb-0">
      <div className="flex-1 px-3 md:px-6 py-4 md:py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground">Estudos para a OAB</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Todas as ferramentas para sua aprovação
            </p>
          </div>
        </div>

        {/* Lista de Funções */}
        <div className="flex flex-col gap-3">
          {funcoes.map((funcao) => {
            const Icon = funcao.icon;
            return (
              <button
                key={funcao.id}
                onClick={() => navigate(funcao.route)}
                className="bg-gradient-to-br from-[hsl(0,75%,55%)] to-[hsl(350,70%,45%)] rounded-xl p-4 text-left transition-all hover:scale-[1.02] hover:shadow-2xl flex items-center gap-4 relative overflow-hidden shadow-xl"
              >
                <div className="absolute inset-0 bg-gradient-to-tl from-black/60 via-black/30 to-transparent pointer-events-none" />
                <div className="bg-white/20 rounded-lg p-3 relative z-10 shadow-lg">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 relative z-10">
                  <h3 className="text-base font-bold text-white mb-1" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.6)' }}>
                    {funcao.title}
                  </h3>
                  <p className="text-white/80 text-sm" style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.5)' }}>
                    {funcao.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default OABFuncoes;
