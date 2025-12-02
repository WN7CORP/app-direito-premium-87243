import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, FileDown, Clock, BookOpen, Target, Lightbulb, CheckSquare, RefreshCw, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useToast } from "@/hooks/use-toast";
import { parsePlanoEstudos } from "@/lib/planoEstudosParser";
import { PlanoEstudosAccordion } from "@/components/PlanoEstudosAccordion";
import { exportarPlanoPDF } from "@/lib/exportarPlanoPDF";

const PlanoEstudosResultado = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { plano, materia, totalHoras } = location.state || {};

  if (!plano) {
    navigate("/plano-estudos");
    return null;
  }

  const planoParseado = parsePlanoEstudos(plano);

  const handleExportPDF = () => {
    exportarPlanoPDF({
      plano: planoParseado,
      materia,
      totalHoras,
      dataGeracao: new Date().toLocaleDateString('pt-BR'),
    });
    
    toast({
      title: "PDF exportado!",
      description: "O arquivo foi baixado com sucesso.",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header Fixo */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border/50 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/plano-estudos")}
              className="shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="min-w-0">
              <h1 className="text-lg md:text-xl font-bold truncate">Plano de Estudos</h1>
              <p className="text-xs text-muted-foreground hidden sm:block">
                Seu cronograma personalizado
              </p>
            </div>
          </div>
          <Button 
            onClick={handleExportPDF} 
            size="sm"
            className="shrink-0 gap-2"
          >
            <FileDown className="w-4 h-4" />
            <span className="hidden sm:inline">Exportar PDF</span>
            <span className="sm:hidden">PDF</span>
          </Button>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="px-4 py-6 max-w-4xl mx-auto space-y-4 pb-24 md:pb-6">
        {/* Card de Informações */}
        <Card className="overflow-hidden border-0 shadow-lg">
          <div className="bg-gradient-to-r from-primary to-primary/80 p-4 md:p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm">
                <GraduationCap className="w-6 h-6 text-primary-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-primary-foreground/70 uppercase tracking-wider font-medium">
                  Matéria
                </p>
                <p className="font-bold text-lg text-primary-foreground truncate">
                  {materia}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary-foreground/70" />
                  <span className="text-xs text-primary-foreground/70">Carga Total</span>
                </div>
                <p className="font-bold text-xl text-primary-foreground mt-1">{totalHoras}h</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-primary-foreground/70" />
                  <span className="text-xs text-primary-foreground/70">Semanas</span>
                </div>
                <p className="font-bold text-xl text-primary-foreground mt-1">
                  {planoParseado.semanas.length || '-'}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Objetivo e Visão Geral */}
        {(planoParseado.objetivo || planoParseado.visaoGeral) && (
          <Card className="border-0 shadow-md overflow-hidden">
            <CardContent className="p-0">
              {planoParseado.objetivo && (
                <div className="p-4 md:p-6 border-b border-border/50">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-amber-500/10">
                      <Target className="w-5 h-5 text-amber-500" />
                    </div>
                    <h2 className="text-lg font-bold">Objetivo</h2>
                  </div>
                  <div className="prose prose-sm max-w-none dark:prose-invert text-muted-foreground">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {planoParseado.objetivo}
                    </ReactMarkdown>
                  </div>
                </div>
              )}
              {planoParseado.visaoGeral && (
                <div className="p-4 md:p-6 bg-muted/30">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-500/10">
                      <BookOpen className="w-5 h-5 text-blue-500" />
                    </div>
                    <h2 className="text-lg font-bold">Visão Geral</h2>
                  </div>
                  <div className="prose prose-sm max-w-none dark:prose-invert text-muted-foreground">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {planoParseado.visaoGeral}
                    </ReactMarkdown>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Cronograma Semanal */}
        {planoParseado.semanas.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-3 px-1">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-lg font-bold">Cronograma Semanal</h2>
            </div>
            <PlanoEstudosAccordion semanas={planoParseado.semanas} />
          </div>
        )}

        {/* Materiais de Estudo */}
        {planoParseado.materiaisEstudo && (
          <Card className="border-0 shadow-md overflow-hidden">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-500/10">
                  <BookOpen className="w-5 h-5 text-emerald-500" />
                </div>
                <h2 className="text-lg font-bold">Materiais de Estudo</h2>
              </div>
              <div className="prose prose-sm max-w-none dark:prose-invert text-muted-foreground bg-muted/30 rounded-lg p-4">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {planoParseado.materiaisEstudo}
                </ReactMarkdown>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Estratégias */}
        {planoParseado.estrategias && (
          <Card className="border-0 shadow-md overflow-hidden">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-purple-500/10">
                  <Lightbulb className="w-5 h-5 text-purple-500" />
                </div>
                <h2 className="text-lg font-bold">Estratégias</h2>
              </div>
              <div className="prose prose-sm max-w-none dark:prose-invert text-muted-foreground bg-muted/30 rounded-lg p-4">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {planoParseado.estrategias}
                </ReactMarkdown>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Checklist */}
        {planoParseado.checklist && (
          <Card className="border-0 shadow-md overflow-hidden">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-green-500/10">
                  <CheckSquare className="w-5 h-5 text-green-500" />
                </div>
                <h2 className="text-lg font-bold">Checklist</h2>
              </div>
              <div className="prose prose-sm max-w-none dark:prose-invert text-muted-foreground bg-muted/30 rounded-lg p-4">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {planoParseado.checklist}
                </ReactMarkdown>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Revisão Final */}
        {planoParseado.revisaoFinal && (
          <Card className="border-0 shadow-md overflow-hidden">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-orange-500/10">
                  <RefreshCw className="w-5 h-5 text-orange-500" />
                </div>
                <h2 className="text-lg font-bold">Revisão Final</h2>
              </div>
              <div className="prose prose-sm max-w-none dark:prose-invert text-muted-foreground bg-muted/30 rounded-lg p-4">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {planoParseado.revisaoFinal}
                </ReactMarkdown>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Botão Desktop - Novo Plano */}
        <div className="hidden md:block">
          <Button
            onClick={() => navigate("/plano-estudos")}
            variant="outline"
            className="w-full"
            size="lg"
          >
            Criar Novo Plano
          </Button>
        </div>
      </main>

      {/* Footer Fixo Mobile */}
      <footer className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border/50 p-4 md:hidden">
        <div className="flex gap-3 max-w-4xl mx-auto">
          <Button
            onClick={() => navigate("/plano-estudos")}
            variant="outline"
            className="flex-1"
          >
            Novo Plano
          </Button>
          <Button 
            onClick={handleExportPDF}
            className="flex-1 gap-2"
          >
            <FileDown className="w-4 h-4" />
            Exportar PDF
          </Button>
        </div>
      </footer>
    </div>
  );
};

export default PlanoEstudosResultado;
