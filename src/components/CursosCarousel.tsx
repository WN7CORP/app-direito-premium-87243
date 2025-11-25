import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCursosCache } from "@/hooks/useCursosCache";
import { SmartLoadingIndicator } from "@/components/chat/SmartLoadingIndicator";

interface CursoDestaque {
  id: string;
  tema: string;
  area: string;
  thumbnailUrl: string;
  corHex: string;
}

const CORES_AREAS: Record<string, string> = {
  "Direito Penal": "#ef4444",
  "Direito Civil": "#3b82f6",
  "Direito Constitucional": "#10b981",
  "Direito Administrativo": "#a855f7",
  "Direito Trabalhista": "#f59e0b",
  "Direito do Trabalho": "#f59e0b",
  "Direito Empresarial": "#ec4899",
  "Direito Tributário": "#6366f1",
  "Direito Processual Civil": "#06b6d4",
  "Processo Civil": "#06b6d4",
  "Direito Processual Penal": "#f97316"
};

export const CursosCarousel = () => {
  const navigate = useNavigate();
  const { cursos, loading: cursosLoading } = useCursosCache();
  const [cursosDestaque, setCursosDestaque] = useState<CursoDestaque[]>([]);
  const [areaAtual, setAreaAtual] = useState<string>("");

  useEffect(() => {
    if (!cursosLoading && cursos.length > 0) {
      // Agrupar cursos por área
      const cursosPorArea = new Map<string, any[]>();
      
      cursos.forEach((curso: any) => {
        const area = curso.area;
        if (!cursosPorArea.has(area)) {
          cursosPorArea.set(area, []);
        }
        cursosPorArea.get(area)!.push(curso);
      });

      // Pegar uma área aleatória a cada visita
      const areas = Array.from(cursosPorArea.keys());
      const areaAleatoria = areas[Math.floor(Math.random() * areas.length)];
      const cursosArea = cursosPorArea.get(areaAleatoria) || [];
      
      // Pegar até 4 cursos dessa área para destaque
      const cursosParaDestaque: CursoDestaque[] = cursosArea
        .slice(0, 4)
        .map((curso: any) => ({
          id: curso.id,
          tema: curso.tema,
          area: curso.area,
          thumbnailUrl: curso.thumbnailUrl,
          corHex: CORES_AREAS[curso.area] || "#6b7280"
        }));

      setCursosDestaque(cursosParaDestaque);
      setAreaAtual(areaAleatoria);
    }
  }, [cursosLoading, cursos]);

  if (cursosLoading) {
    return <SmartLoadingIndicator nome="Cursos" />;
  }

  if (cursosDestaque.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in">
      {cursosDestaque.map((curso, idx) => (
        <button
          key={curso.id}
          onClick={() => navigate(`/iniciando-direito/${encodeURIComponent(curso.area)}/aula/${encodeURIComponent(curso.tema)}`)}
          className="group relative bg-card/80 backdrop-blur-sm border-2 rounded-2xl overflow-hidden transition-all duration-500 hover:scale-105 hover:shadow-2xl"
          style={{
            borderColor: curso.corHex + '80',
            animationDelay: `${idx * 100}ms`
          }}
        >
          {/* Capa do curso */}
          <div className="relative aspect-video w-full overflow-hidden bg-muted">
            <img 
              src={curso.thumbnailUrl} 
              alt={curso.tema}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            {/* Overlay gradiente */}
            <div 
              className="absolute inset-0 opacity-0 group-hover:opacity-60 transition-opacity duration-500"
              style={{
                background: `linear-gradient(to top, ${curso.corHex}80, transparent)`
              }}
            />
          </div>

          {/* Informações do curso */}
          <div className="p-4 space-y-2">
            <h3 className="font-bold text-sm leading-tight text-foreground line-clamp-2 text-left">
              {curso.tema}
            </h3>
            <p 
              className="text-xs font-semibold text-left"
              style={{ color: curso.corHex }}
            >
              {curso.area.replace('Direito ', '')}
            </p>
          </div>

          {/* Glow effect on hover */}
          <div 
            className="absolute inset-0 opacity-0 group-hover:opacity-20 blur-2xl transition-opacity duration-500 pointer-events-none"
            style={{ 
              backgroundColor: curso.corHex,
              boxShadow: `0 0 60px ${curso.corHex}`
            }}
          />
        </button>
      ))}
    </div>
  );
};
