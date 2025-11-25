import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Video, BookOpen, Zap, Brain, BookMarked, ScrollText, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
      <div className="min-h-screen bg-gradient-to-br from-background via-card to-background pb-20">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <SmartLoadingIndicator nome="Conteúdos da Área" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background pb-20">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header com cor da área */}
        <div className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/central-conteudos")}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>

          <div className="relative rounded-2xl overflow-hidden p-6 mb-6">
            <div
              className={`absolute inset-0 bg-gradient-to-br ${cores.cor} opacity-20`}
            />
            <div className="relative z-10">
              <h1 className="text-3xl md:text-4xl font-bold mb-2">{area}</h1>
              <p className="text-muted-foreground">
                {totalConteudos} {totalConteudos === 1 ? "conteúdo disponível" : "conteúdos disponíveis"}
              </p>
            </div>
          </div>
        </div>

        {/* Accordion de Conteúdos */}
        <Accordion type="multiple" className="space-y-4">
          {/* Videoaulas */}
          {conteudos.videoaulas.length > 0 && (
            <AccordionItem value="videoaulas" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${cores.cor} flex items-center justify-center`}>
                    <Video className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold">Videoaulas</h3>
                    <p className="text-sm text-muted-foreground">
                      {conteudos.videoaulas.length} {conteudos.videoaulas.length === 1 ? "videoaula" : "videoaulas"}
                    </p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-4">
                  {conteudos.videoaulas.map((video: any) => (
                    <Card
                      key={video.id}
                      className="cursor-pointer hover:bg-accent transition-colors"
                      onClick={() => navigate(`/videoaulas/player?link=${encodeURIComponent(video.link)}`)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Video className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm mb-1 line-clamp-2">{video.area}</h4>
                            {video.tema && (
                              <p className="text-xs text-muted-foreground line-clamp-1">{video.tema}</p>
                            )}
                          </div>
                          <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0" />
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
            <AccordionItem value="biblioteca" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${cores.cor} flex items-center justify-center`}>
                    <BookOpen className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold">Biblioteca de Estudos</h3>
                    <p className="text-sm text-muted-foreground">
                      {conteudos.biblioteca.length} {conteudos.biblioteca.length === 1 ? "livro" : "livros"}
                    </p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-4">
                  {conteudos.biblioteca.map((livro: any) => (
                    <Card
                      key={livro.id}
                      className="cursor-pointer hover:bg-accent transition-colors"
                      onClick={() => navigate(`/biblioteca-estudos/${livro.id}`)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <BookOpen className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm mb-1 line-clamp-2">{livro.Tema}</h4>
                            <p className="text-xs text-muted-foreground">{livro.Área}</p>
                          </div>
                          <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0" />
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
            <AccordionItem value="flashcards" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${cores.cor} flex items-center justify-center`}>
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold">Flashcards</h3>
                    <p className="text-sm text-muted-foreground">
                      {conteudos.flashcards.reduce((sum: number, f: any) => sum + (f.total_questoes || 0), 0)} flashcards
                    </p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-4">
                  {conteudos.flashcards.map((tema: any) => (
                    <Card
                      key={tema.tema}
                      className="cursor-pointer hover:bg-accent transition-colors"
                      onClick={() => navigate(`/flashcards/estudar?area=${encodeURIComponent(area || "")}&tema=${encodeURIComponent(tema.tema)}`)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Zap className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm mb-1 line-clamp-2">{tema.tema}</h4>
                            <p className="text-xs text-muted-foreground">
                              {tema.total_questoes} {tema.total_questoes === 1 ? "flashcard" : "flashcards"}
                            </p>
                          </div>
                          <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0" />
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
            <AccordionItem value="mapamental" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${cores.cor} flex items-center justify-center`}>
                    <Brain className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold">Mapas Mentais</h3>
                    <p className="text-sm text-muted-foreground">
                      {conteudos.mapaMental.length} {conteudos.mapaMental.length === 1 ? "mapa" : "mapas"}
                    </p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-4">
                  {conteudos.mapaMental.map((mapa: any) => (
                    <Card key={mapa.id} className="hover:bg-accent transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Brain className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm mb-1 line-clamp-2">{mapa.tema}</h4>
                            <p className="text-xs text-muted-foreground">{mapa.area}</p>
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
            <AccordionItem value="cursos" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${cores.cor} flex items-center justify-center`}>
                    <BookMarked className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold">Cursos</h3>
                    <p className="text-sm text-muted-foreground">
                      {conteudos.cursos.length} {conteudos.cursos.length === 1 ? "curso" : "cursos"}
                    </p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-4">
                  {conteudos.cursos.map((curso: any) => (
                    <Card
                      key={curso.id}
                      className="cursor-pointer hover:bg-accent transition-colors"
                      onClick={() => navigate(`/cursos/modulos?area=${encodeURIComponent(curso.area)}&tema=${encodeURIComponent(curso.tema)}`)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <BookMarked className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm mb-1 line-clamp-2">{curso.tema}</h4>
                            <p className="text-xs text-muted-foreground">{curso.area}</p>
                          </div>
                          <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0" />
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
            <AccordionItem value="resumos" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${cores.cor} flex items-center justify-center`}>
                    <ScrollText className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold">Resumos Jurídicos</h3>
                    <p className="text-sm text-muted-foreground">
                      {conteudos.resumos.length} {conteudos.resumos.length === 1 ? "resumo" : "resumos"}
                    </p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-4">
                  {conteudos.resumos.map((resumo: any) => (
                    <Card
                      key={resumo.id}
                      className="cursor-pointer hover:bg-accent transition-colors"
                      onClick={() => navigate(`/resumos-juridicos/prontos/view?id=${resumo.id}`)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <ScrollText className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm mb-1 line-clamp-2">{resumo.tema}</h4>
                            {resumo.subtema && (
                              <p className="text-xs text-muted-foreground line-clamp-1">{resumo.subtema}</p>
                            )}
                          </div>
                          <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0" />
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
