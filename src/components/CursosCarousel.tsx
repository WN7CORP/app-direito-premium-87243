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

  return (
    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 animate-fade-in">
      {areasAgrupadas.map((area, idx) => (
        <button
          key={area.area}
          onClick={() => navigate(`/iniciando-direito/${encodeURIComponent(area.area)}/sobre`)}
          className="group relative bg-card border-2 rounded-xl p-4 transition-all duration-300 hover:scale-105 hover:shadow-xl flex flex-col items-center justify-center gap-2 min-h-[130px] overflow-hidden"
          style={{
            borderColor: area.corHex + '60',
            animationDelay: `${idx * 50}ms`
          }}
        >
          {/* Gradiente de fundo sutil */}
          <div 
            className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-300"
            style={{
              background: `linear-gradient(135deg, ${area.corHex}, transparent)`
            }}
          />
          
          {/* Ícone */}
          <div 
            className="relative rounded-full p-2.5 transition-transform duration-300 group-hover:scale-110"
            style={{
              backgroundColor: area.corHex + '20'
            }}
          >
            <GraduationCap 
              className="w-6 h-6 transition-transform duration-300 group-hover:rotate-12" 
              style={{ color: area.corHex }}
            />
          </div>

          {/* Nome da área */}
          <div className="relative text-center">
            <h3 className="font-bold text-xs leading-tight text-foreground">
              {area.nomeCompacto}
            </h3>
            <p 
              className="text-[10px] font-semibold mt-1 flex items-center justify-center gap-1"
              style={{ color: area.corHex }}
            >
              <span>{area.numeroAulas}</span>
              <span className="text-muted-foreground">aulas</span>
            </p>
          </div>

          {/* Glow effect on hover */}
          <div 
            className="absolute inset-0 opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-300 pointer-events-none"
            style={{ backgroundColor: area.corHex }}
          />
        </button>
      ))}
    </div>
  );
};
