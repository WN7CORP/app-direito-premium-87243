import { useNavigate } from "react-router-dom";
import { Scale } from "lucide-react";

const Sumulas = () => {
  const navigate = useNavigate();

  const sumulas = [
    {
      id: "vinculantes",
      title: "Súmulas Vinculantes",
      description: "Súmulas Vinculantes do STF",
      icon: Scale
    },
    {
      id: "sumulas",
      title: "Súmulas",
      description: "Súmulas do STF e STJ",
      icon: Scale
    }
  ];

  return (
    <div className="px-3 py-4 max-w-4xl mx-auto pb-24">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-cyan-600 shadow-lg shadow-cyan-500/50">
            <Scale className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold">Súmulas</h1>
            <p className="text-sm text-muted-foreground">
              Acesse as súmulas do STF e STJ
            </p>
          </div>
        </div>
      </div>

      {/* Súmulas Grid */}
      <div className="grid grid-cols-2 gap-3">
        {sumulas.map((sumula) => {
          const Icon = sumula.icon;
          return (
            <button
              key={sumula.id}
              onClick={() => navigate(`/sumula/${sumula.id}`)}
              className="bg-card hover:scale-105 hover:shadow-xl hover:-translate-y-1 transition-all border-2 border-transparent hover:border-primary/50 bg-gradient-to-br from-card to-card/80 group overflow-hidden relative rounded-xl"
            >
              <div 
                className="absolute top-0 left-0 right-0 h-1 opacity-80"
                style={{
                  background: `linear-gradient(90deg, transparent, hsl(174,72%,56%), transparent)`,
                  boxShadow: `0 0 20px hsl(174,72%,56%)`
                }}
              />
              
              <div className="p-4 flex flex-col items-center text-center min-h-[140px] justify-center">
                <div className="bg-[hsl(174,72%,56%)]/10 rounded-full p-3 mb-2">
                  <Icon className="w-6 h-6 text-[hsl(174,72%,56%)]" />
                </div>
                <h3 className="font-bold text-base mb-1">{sumula.title}</h3>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {sumula.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Sumulas;
