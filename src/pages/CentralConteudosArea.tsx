import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { SmartLoadingIndicator } from "@/components/chat/SmartLoadingIndicator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface ConteudosArea {
  videoaulas: any[];
  biblioteca: any[];
  flashcards: any[];
  mapaMental: any[];
  cursos: any[];
  resumos: any[];
}

const CORES_POR_AREA: Record<string, { cor: string; glowColor: string }> = {
  "DIREITO CIVIL": { cor: "from-red-500 to-red-700", glowColor: "rgb(239, 68, 68)" },
  "DIREITO CONSTITUCIONAL": { cor: "from-blue-500 to-blue-700", glowColor: "rgb(59, 130, 246)" },
  "DIREITO EMPRESARIAL": { cor: "from-green-500 to-green-700", glowColor: "rgb(34, 197, 94)" },
  "DIREITO PENAL": { cor: "from-purple-500 to-purple-700", glowColor: "rgb(168, 85, 247)" },
  "DIREITO TRIBUTÁRIO": { cor: "from-yellow-500 to-yellow-700", glowColor: "rgb(234, 179, 8)" },
  "DIREITO ADMINISTRATIVO": { cor: "from-indigo-500 to-indigo-700", glowColor: "rgb(99, 102, 241)" },
  "DIREITO TRABALHISTA": { cor: "from-orange-500 to-orange-700", glowColor: "rgb(249, 115, 22)" },
  "DIREITO PROCESSUAL CIVIL": { cor: "from-cyan-500 to-cyan-700", glowColor: "rgb(6, 182, 212)" },
  "DIREITO PROCESSUAL PENAL": { cor: "from-pink-500 to-pink-700", glowColor: "rgb(236, 72, 153)" }
};

const CORES_DEFAULT = { cor: "from-violet-500 to-violet-700", glowColor: "rgb(124, 58, 237)" };

const normalizeArea = (area: string): string => {
  return area.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
};

export default function CentralConteudosArea() {
  const navigate = useNavigate();
  const { area } = useParams<{ area: string }>();
  const [conteudos, setConteudos] = useState<ConteudosArea>({
    videoaulas: [],
    biblioteca: [],
    flashcards: [],
    mapaMental: [],
    cursos: [],
    resumos: []
  });
  const [loading, setLoading] = useState(true);

  const areaNormalizada = area ? normalizeArea(decodeURIComponent(area)) : "";
  const cores = CORES_POR_AREA[areaNormalizada] || CORES_DEFAULT;

  useEffect(() => {
    if (area) {
      fetchConteudosArea();
    }
  }, [area]);

  const fetchConteudosArea = async () => {
    if (!area) return;

    try {
      const areaBusca = decodeURIComponent(area);

      // Buscar todos os conteúdos em paralelo
      const [videoaulasRes, bibliotecaRes, flashcardsRes, mapaRes, cursosRes, resumosRes] = await Promise.all([
        supabase.from("VIDEO AULAS-NOVO" as any).select("*").ilike("area", `%${areaBusca}%`),
        supabase.from("BIBLIOTECA-ESTUDOS" as any).select("*").ilike("Área", `%${areaBusca}%`),
        supabase.rpc("get_flashcard_temas", { p_area: areaBusca }),
        supabase.from("MAPA MENTAL" as any).select("*").ilike("area", `%${areaBusca}%`),
        supabase.from("CURSOS-APP" as any).select("*").ilike("area", `%${areaBusca}%`),
        supabase.from("RESUMO" as any).select("*").ilike("area", `%${areaBusca}%`)
      ]);

      // VIDEO AULAS-NOVO já contém vídeos individuais detalhados, não playlists
      setConteudos({
        videoaulas: videoaulasRes.data || [],
        biblioteca: bibliotecaRes.data || [],
        flashcards: flashcardsRes.data || [],
        mapaMental: mapaRes.data || [],
        cursos: cursosRes.data || [],
        resumos: resumosRes.data || []
      });
    } catch (error) {
      console.error("Erro ao buscar conteúdos:", error);
    } finally {
      setLoading(false);
    }
  };

  const totalConteudos =
    conteudos.videoaulas.length +
    conteudos.biblioteca.length +
    conteudos.flashcards.length +
    conteudos.mapaMental.length +
    conteudos.cursos.length +
    conteudos.resumos.length;

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <SmartLoadingIndicator nome="Conteúdos da Área" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header Elegante */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/central-conteudos")}
          className="mb-6 hover:bg-primary/10"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        <div className="relative rounded-3xl overflow-hidden p-8 mb-8 shadow-2xl">
          <div
            className={`absolute inset-0 bg-gradient-to-br ${cores.cor} opacity-90`}
          />
          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(circle at 30% 20%, ${cores.glowColor}40, transparent 70%)`
            }}
          />
          <div className="relative z-10">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-3 drop-shadow-lg">
              {area}
            </h1>
            <p className="text-white/90 text-lg">
              {totalConteudos} {totalConteudos === 1 ? "conteúdo disponível" : "conteúdos disponíveis"}
            </p>
          </div>
        </div>

        {/* Accordion Elegante */}
        <Accordion type="multiple" className="space-y-4">
          {/* Videoaulas */}
          {conteudos.videoaulas.length > 0 && (
            <AccordionItem value="videoaulas" className="border-2 rounded-2xl px-6 bg-card/50 backdrop-blur-sm overflow-hidden">
              <AccordionTrigger className="hover:no-underline py-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/20">
                    <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M23 7l-7 5 7 5V7z" />
                      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg font-bold">Videoaulas</h3>
                    <p className="text-sm text-muted-foreground">
                      {conteudos.videoaulas.length} {conteudos.videoaulas.length === 1 ? "playlist" : "playlists"}
                    </p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-1 gap-3 pt-2 pb-4">
                  {conteudos.videoaulas.map((video: any, index: number) => (
                    <Card
                      key={video.link || index}
                      className="cursor-pointer hover:bg-accent/50 transition-all duration-200 border-2 hover:border-red-500/30 group"
                      onClick={() => navigate(`/videoaulas/player?link=${encodeURIComponent(video.link)}`)}
                    >
                      <CardContent className="p-5">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-red-500/20 transition-colors">
                            <svg className="w-6 h-6 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M23 7l-7 5 7 5V7z" />
                              <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-base mb-1 line-clamp-2">
                              {video.titulo}
                            </h4>
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {video.categoria} • {video.tempo}
                            </p>
                          </div>
                          <ExternalLink className="w-5 h-5 text-muted-foreground flex-shrink-0 group-hover:text-red-500 transition-colors" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Biblioteca */}
          {conteudos.biblioteca.length > 0 && (
            <AccordionItem value="biblioteca" className="border-2 rounded-2xl px-6 bg-card/50 backdrop-blur-sm overflow-hidden">
              <AccordionTrigger className="hover:no-underline py-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg font-bold">Biblioteca de Estudos</h3>
                    <p className="text-sm text-muted-foreground">
                      {conteudos.biblioteca.length} {conteudos.biblioteca.length === 1 ? "livro" : "livros"}
                    </p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-1 gap-3 pt-2 pb-4">
                  {conteudos.biblioteca.map((livro: any) => (
                    <Card
                      key={livro.id}
                      className="cursor-pointer hover:bg-accent/50 transition-all duration-200 border-2 hover:border-blue-500/30 group"
                      onClick={() => navigate(`/biblioteca-estudos/${livro.id}`)}
                    >
                      <CardContent className="p-5">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-500/20 transition-colors">
                            <svg className="w-6 h-6 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-base mb-1 line-clamp-2">{livro.Tema}</h4>
                            <p className="text-sm text-muted-foreground">{livro.Área}</p>
                          </div>
                          <ExternalLink className="w-5 h-5 text-muted-foreground flex-shrink-0 group-hover:text-blue-500 transition-colors" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Flashcards */}
          {conteudos.flashcards.length > 0 && (
            <AccordionItem value="flashcards" className="border-2 rounded-2xl px-6 bg-card/50 backdrop-blur-sm overflow-hidden">
              <AccordionTrigger className="hover:no-underline py-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center shadow-lg shadow-yellow-500/20">
                    <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg font-bold">Flashcards</h3>
                    <p className="text-sm text-muted-foreground">
                      {conteudos.flashcards.reduce((sum: number, f: any) => sum + (f.total_questoes || 0), 0)} flashcards
                    </p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-1 gap-3 pt-2 pb-4">
                  {conteudos.flashcards.map((tema: any) => (
                    <Card
                      key={tema.tema}
                      className="cursor-pointer hover:bg-accent/50 transition-all duration-200 border-2 hover:border-yellow-500/30 group"
                      onClick={() => navigate(`/flashcards/estudar?area=${encodeURIComponent(area || "")}&tema=${encodeURIComponent(tema.tema)}`)}
                    >
                      <CardContent className="p-5">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-lg bg-yellow-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-yellow-500/20 transition-colors">
                            <svg className="w-6 h-6 text-yellow-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-base mb-1 line-clamp-2">{tema.tema}</h4>
                            <p className="text-sm text-muted-foreground">
                              {tema.total_questoes} {tema.total_questoes === 1 ? "flashcard" : "flashcards"}
                            </p>
                          </div>
                          <ExternalLink className="w-5 h-5 text-muted-foreground flex-shrink-0 group-hover:text-yellow-500 transition-colors" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Mapas Mentais */}
          {conteudos.mapaMental.length > 0 && (
            <AccordionItem value="mapamental" className="border-2 rounded-2xl px-6 bg-card/50 backdrop-blur-sm overflow-hidden">
              <AccordionTrigger className="hover:no-underline py-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                    <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5" />
                      <path d="M8.5 8.5v.01" />
                      <path d="M16 15.5v.01" />
                      <path d="M12 12v.01" />
                      <path d="M11 17v.01" />
                      <path d="M7 14v.01" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg font-bold">Mapas Mentais</h3>
                    <p className="text-sm text-muted-foreground">
                      {conteudos.mapaMental.length} {conteudos.mapaMental.length === 1 ? "mapa" : "mapas"}
                    </p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-1 gap-3 pt-2 pb-4">
                  {conteudos.mapaMental.map((mapa: any) => (
                    <Card key={mapa.id} className="hover:bg-accent/50 transition-all duration-200 border-2 hover:border-purple-500/30">
                      <CardContent className="p-5">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                            <svg className="w-6 h-6 text-purple-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5" />
                              <path d="M8.5 8.5v.01" />
                              <path d="M16 15.5v.01" />
                              <path d="M12 12v.01" />
                              <path d="M11 17v.01" />
                              <path d="M7 14v.01" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-base mb-1 line-clamp-2">{mapa.tema}</h4>
                            <p className="text-sm text-muted-foreground">{mapa.area}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Cursos */}
          {conteudos.cursos.length > 0 && (
            <AccordionItem value="cursos" className="border-2 rounded-2xl px-6 bg-card/50 backdrop-blur-sm overflow-hidden">
              <AccordionTrigger className="hover:no-underline py-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg shadow-green-500/20">
                    <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg font-bold">Cursos</h3>
                    <p className="text-sm text-muted-foreground">
                      {conteudos.cursos.length} {conteudos.cursos.length === 1 ? "curso" : "cursos"}
                    </p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-1 gap-3 pt-2 pb-4">
                  {conteudos.cursos.map((curso: any) => (
                    <Card
                      key={curso.id}
                      className="cursor-pointer hover:bg-accent/50 transition-all duration-200 border-2 hover:border-green-500/30 group"
                      onClick={() => navigate(`/cursos/modulos?area=${encodeURIComponent(curso.area)}&tema=${encodeURIComponent(curso.tema)}`)}
                    >
                      <CardContent className="p-5">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-green-500/20 transition-colors">
                            <svg className="w-6 h-6 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-base mb-1 line-clamp-2">{curso.tema}</h4>
                            <p className="text-sm text-muted-foreground">{curso.area}</p>
                          </div>
                          <ExternalLink className="w-5 h-5 text-muted-foreground flex-shrink-0 group-hover:text-green-500 transition-colors" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Resumos */}
          {conteudos.resumos.length > 0 && (
            <AccordionItem value="resumos" className="border-2 rounded-2xl px-6 bg-card/50 backdrop-blur-sm overflow-hidden">
              <AccordionTrigger className="hover:no-underline py-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
                    <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <path d="M14 2v6h6" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                      <line x1="10" y1="9" x2="8" y2="9" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg font-bold">Resumos Jurídicos</h3>
                    <p className="text-sm text-muted-foreground">
                      {conteudos.resumos.length} {conteudos.resumos.length === 1 ? "resumo" : "resumos"}
                    </p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-1 gap-3 pt-2 pb-4">
                  {conteudos.resumos.map((resumo: any) => (
                    <Card
                      key={resumo.id}
                      className="cursor-pointer hover:bg-accent/50 transition-all duration-200 border-2 hover:border-orange-500/30 group"
                      onClick={() => navigate(`/resumos-juridicos/prontos/view?id=${resumo.id}`)}
                    >
                      <CardContent className="p-5">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-orange-500/20 transition-colors">
                            <svg className="w-6 h-6 text-orange-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                              <path d="M14 2v6h6" />
                              <line x1="16" y1="13" x2="8" y2="13" />
                              <line x1="16" y1="17" x2="8" y2="17" />
                              <line x1="10" y1="9" x2="8" y2="9" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-base mb-1 line-clamp-2">{resumo.tema}</h4>
                            {resumo.subtema && (
                              <p className="text-sm text-muted-foreground line-clamp-1">{resumo.subtema}</p>
                            )}
                          </div>
                          <ExternalLink className="w-5 h-5 text-muted-foreground flex-shrink-0 group-hover:text-orange-500 transition-colors" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>

        {/* Mensagem se não houver conteúdos */}
        {totalConteudos === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Nenhum conteúdo encontrado para esta área.</p>
          </div>
        )}
      </div>
    </div>
  );
}
