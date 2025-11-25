import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCursosCache } from "@/hooks/useCursosCache";
import { GraduationCap } from "lucide-react";
import { SmartLoadingIndicator } from "@/components/chat/SmartLoadingIndicator";

interface AreaCurso {
  area: string;
  corHex: string;
  numeroAulas: number;
  nomeCompacto: string;
}

const CORES_AREAS: Record<string, { cor: string; nomeCompacto: string }> = {
  "Direito Penal": { cor: "#ef4444", nomeCompacto: "Penal" },
  "Direito Civil": { cor: "#3b82f6", nomeCompacto: "Civil" },
  "Direito Constitucional": { cor: "#10b981", nomeCompacto: "Constitucional" },
  "Direito Administrativo": { cor: "#a855f7", nomeCompacto: "Administrativo" },
  "Direito Trabalhista": { cor: "#f59e0b", nomeCompacto: "Trabalhista" },
  "Direito Empresarial": { cor: "#ec4899", nomeCompacto: "Empresarial" },
  "Direito Tributário": { cor: "#6366f1", nomeCompacto: "Tributário" },
  "Direito Processual Civil": { cor: "#06b6d4", nomeCompacto: "Proc. Civil" },
  "Direito Processual Penal": { cor: "#f97316", nomeCompacto: "Proc. Penal" }
};

export const CursosCarousel = () => {
  const navigate = useNavigate();
  const { cursos, loading: cursosLoading } = useCursosCache();
  const [areasAgrupadas, setAreasAgrupadas] = useState<AreaCurso[]>([]);

  useEffect(() => {
    if (!cursosLoading && cursos.length > 0) {
      // Agrupar cursos por área e contar número de aulas
      const areaMap = new Map<string, number>();
      
      cursos.forEach((curso: any) => {
        const area = curso.area;
        areaMap.set(area, (areaMap.get(area) || 0) + 1);
      });

      // Converter para array de AreaCurso
      const areas: AreaCurso[] = Array.from(areaMap.entries()).map(([area, count]) => ({
        area,
        corHex: CORES_AREAS[area]?.cor || "#6b7280",
        nomeCompacto: CORES_AREAS[area]?.nomeCompacto || area,
        numeroAulas: count
      }));

      setAreasAgrupadas(areas);
    }
  }, [cursosLoading, cursos]);

  if (cursosLoading) {
    return <SmartLoadingIndicator nome="Cursos" />;
  }

  if (areasAgrupadas.length === 0) {
    return null;
  }

  // Pegar apenas as 4 primeiras áreas para destaque
  const areasDestaque = areasAgrupadas.slice(0, 4);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in">
      {areasDestaque.map((area, idx) => (
        <button
          key={area.area}
          onClick={() => navigate(`/iniciando-direito/${encodeURIComponent(area.area)}/sobre`)}
          className="group relative bg-card/80 backdrop-blur-sm border-2 rounded-2xl p-6 transition-all duration-500 hover:scale-105 hover:shadow-2xl flex flex-col items-center justify-center gap-4 min-h-[160px] overflow-hidden"
          style={{
            borderColor: area.corHex + '80',
            animationDelay: `${idx * 100}ms`
          }}
        >
          {/* Gradiente de fundo */}
          <div 
            className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500"
            style={{
              background: `linear-gradient(135deg, ${area.corHex}40, transparent)`
            }}
          />
          
          {/* Ícone grande */}
          <div 
            className="relative rounded-full p-5 transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 shadow-lg"
            style={{
              backgroundColor: area.corHex + '25'
            }}
          >
            <GraduationCap 
              className="w-12 h-12 transition-all duration-500" 
              style={{ color: area.corHex }}
            />
          </div>

          {/* Nome da área */}
          <div className="relative text-center space-y-1">
            <h3 className="font-bold text-base leading-tight text-foreground">
              {area.nomeCompacto}
            </h3>
            <p 
              className="text-sm font-bold"
              style={{ color: area.corHex }}
            >
              {area.numeroAulas} aulas
            </p>
          </div>

          {/* Glow effect on hover */}
          <div 
            className="absolute inset-0 opacity-0 group-hover:opacity-30 blur-2xl transition-opacity duration-500 pointer-events-none"
            style={{ 
              backgroundColor: area.corHex,
              boxShadow: `0 0 60px ${area.corHex}`
            }}
          />
        </button>
      ))}
    </div>
  );
};
