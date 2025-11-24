import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Library, GraduationCap, Scale, Book, Briefcase, Loader2, Mic, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface CapaBiblioteca {
  Biblioteca: string | null;
  capa: string | null;
}

const Bibliotecas = () => {
  const navigate = useNavigate();

  const { data: capas, isLoading } = useQuery({
    queryKey: ["capas-biblioteca"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("CAPA-BIBILIOTECA")
        .select("*");

      if (error) throw error;
      return data as any as CapaBiblioteca[];
    },
  });

  const { data: contagens } = useQuery({
    queryKey: ["contagens-bibliotecas"],
    queryFn: async () => {
      const [estudos, classicos, oab, oratoria, lideranca, fora] = await Promise.all([
        supabase.from("BIBLIOTECA-ESTUDOS" as any).select("*", { count: "exact", head: true }),
        supabase.from("BIBLIOTECA-CLASSICOS" as any).select("*", { count: "exact", head: true }),
        supabase.from("BIBILIOTECA-OAB" as any).select("*", { count: "exact", head: true }),
        supabase.from("BIBLIOTECA-ORATORIA" as any).select("*", { count: "exact", head: true }),
        supabase.from("BIBLIOTECA-LIDERANÇA" as any).select("*", { count: "exact", head: true }),
        supabase.from("BIBLIOTECA-FORA-DA-TOGA" as any).select("*", { count: "exact", head: true }),
      ]);
      return {
        estudos: estudos.count || 0,
        classicos: classicos.count || 0,
        oab: oab.count || 0,
        oratoria: oratoria.count || 0,
        lideranca: lideranca.count || 0,
        fora: fora.count || 0,
      };
    },
  });

  const normalize = (s: string) =>
    s
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase()
      .trim();

  const getCapaUrl = (bibliotecaName: string) => {
    const target = normalize(bibliotecaName);
    const match = capas?.find(
      (c) => c.Biblioteca && normalize(c.Biblioteca) === target
    ) || capas?.find(
      (c) => c.Biblioteca && normalize(c.Biblioteca).includes(target)
    ) || capas?.find(
      (c) => c.Biblioteca && target.includes(normalize(c.Biblioteca))
    );
    return match?.capa || null;
  };

  const bibliotecas = [
    {
      title: "Biblioteca de Estudos",
      description: "Materiais de estudo organizados por área do Direito",
      icon: GraduationCap,
      path: "/biblioteca-estudos",
      gradient: "from-green-500/20 to-teal-500/20",
      bibliotecaName: "Biblioteca de Estudos",
      key: "estudos"
    },
    {
      title: "Biblioteca Clássicos",
      description: "Clássicos da literatura jurídica para enriquecer seus conhecimentos",
      icon: Book,
      path: "/biblioteca-classicos",
      gradient: "from-amber-500/20 to-orange-500/20",
      bibliotecaName: "Biblioteca Clássicos",
      key: "classicos"
    },
    {
      title: "Biblioteca da OAB",
      description: "Acesse a biblioteca oficial da OAB com materiais jurídicos essenciais",
      icon: Scale,
      path: "/biblioteca-oab",
      gradient: "from-blue-500/20 to-purple-500/20",
      bibliotecaName: "Biblioteca da OAB",
      key: "oab"
    },
    {
      title: "Biblioteca de Oratória",
      description: "Domine a arte da comunicação e persuasão jurídica",
      icon: Mic,
      path: "/biblioteca-oratoria",
      gradient: "from-purple-500/20 to-pink-500/20",
      bibliotecaName: "Biblioteca de Oratória",
      key: "oratoria"
    },
    {
      title: "Biblioteca de Liderança",
      description: "Desenvolva habilidades de liderança e gestão para sua carreira",
      icon: Users,
      path: "/biblioteca-lideranca",
      gradient: "from-blue-500/20 to-indigo-500/20",
      bibliotecaName: "Biblioteca de Liderança",
      key: "lideranca"
    },
    {
      title: "Biblioteca Fora da Toga",
      description: "Leituras complementares para ampliar sua visão jurídica",
      icon: Briefcase,
      path: "/biblioteca-fora-da-toga",
      gradient: "from-pink-500/20 to-rose-500/20",
      bibliotecaName: "Biblioteca Fora da Toga",
      key: "fora"
    }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="px-3 py-4 max-w-4xl mx-auto pb-6 min-h-screen">
      <div className="mb-6 animate-fade-in">
        <h1 className="text-xl md:text-2xl font-bold mb-1 flex items-center gap-2">
          <Library className="w-6 h-6" />
          Bibliotecas
        </h1>
        <p className="text-sm text-muted-foreground">
          Escolha uma biblioteca para acessar os materiais
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:gap-4">
        {bibliotecas.map((biblioteca, index) => {
          const Icon = biblioteca.icon;
          const capaUrl = getCapaUrl(biblioteca.bibliotecaName);
          const count = contagens?.[biblioteca.key as keyof typeof contagens] || 0;
          
          return (
            <Card
              key={biblioteca.path}
              className="cursor-pointer hover:scale-105 transition-all duration-300 border border-accent/20 hover:border-accent/60 group overflow-hidden shadow-[0_8px_30px_rgba(0,_0,_0,_0.3)] hover:shadow-[0_12px_40px_rgba(8,_112,_184,_0.5)] hover:-translate-y-2 animate-fade-in"
              onClick={() => navigate(biblioteca.path)}
              style={{
                animationDelay: `${index * 0.1}s`,
                animationFillMode: 'backwards'
              }}
            >
              <div className="relative h-32 md:h-40 overflow-hidden">
                {capaUrl ? (
                  <img
                    src={capaUrl}
                    alt={biblioteca.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    loading="lazy"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  <div className={`w-full h-full bg-gradient-to-br ${biblioteca.gradient} flex items-center justify-center`}>
                    <Icon className="w-12 h-12 md:w-16 md:h-16 text-accent group-hover:scale-110 transition-transform duration-300" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                <div className="absolute top-2 right-2 bg-accent text-accent-foreground px-2 py-1 md:px-3 md:py-1.5 rounded-full text-xs md:text-sm font-bold shadow-lg">
                  {count} {count === 1 ? "livro" : "livros"}
                </div>
              </div>
              <CardContent className="p-3 md:p-4 bg-secondary/40">
                <h3 className="font-semibold text-sm md:text-base mb-1 line-clamp-2">{biblioteca.title}</h3>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {biblioteca.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default Bibliotecas;
