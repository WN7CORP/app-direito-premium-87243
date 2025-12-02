import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Calendar, BookOpen, ChevronRight } from "lucide-react";

interface DiaData {
  diaSemana: string;
  conteudo: string;
}

interface SemanaData {
  numero: number;
  titulo: string;
  dias: DiaData[];
  conteudoCompleto: string;
}

interface PlanoEstudosAccordionProps {
  semanas: SemanaData[];
}

export const PlanoEstudosAccordion = ({ semanas }: PlanoEstudosAccordionProps) => {
  if (!semanas || semanas.length === 0) {
    return null;
  }

  return (
    <Accordion type="single" collapsible className="w-full space-y-3">
      {semanas.map((semana) => (
        <AccordionItem 
          key={semana.numero} 
          value={`semana-${semana.numero}`}
          className="border-0 rounded-xl overflow-hidden bg-gradient-to-r from-primary/5 to-accent/5 shadow-sm"
        >
          <AccordionTrigger className="px-4 py-4 hover:no-underline hover:bg-primary/5 transition-colors group">
            <div className="flex items-center gap-3 w-full">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <div className="flex flex-col items-start text-left flex-1 min-w-0">
                <span className="font-bold text-foreground">Semana {semana.numero}</span>
                {semana.titulo && (
                  <span className="text-sm text-muted-foreground truncate w-full">
                    {semana.titulo}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground bg-background/50 px-2 py-1 rounded-full shrink-0">
                <BookOpen className="w-3 h-3" />
                <span>{semana.dias.length || 1} dias</span>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 pt-0">
            {semana.dias.length > 0 ? (
              <div className="space-y-2 mt-2">
                {semana.dias.map((dia, idx) => (
                  <Accordion key={idx} type="single" collapsible>
                    <AccordionItem 
                      value={`dia-${idx}`}
                      className="border border-border/30 rounded-lg bg-background/80 overflow-hidden"
                    >
                      <AccordionTrigger className="px-4 py-3 text-sm hover:no-underline hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-3 w-full">
                          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-accent/10 text-accent shrink-0">
                            <ChevronRight className="w-4 h-4" />
                          </div>
                          <span className="font-semibold text-foreground">{dia.diaSemana}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4">
                        <div className="prose prose-sm max-w-none dark:prose-invert pl-11">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {dia.conteudo}
                          </ReactMarkdown>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                ))}
              </div>
            ) : (
              <div className="prose prose-sm max-w-none dark:prose-invert mt-2 pl-2 bg-background/50 rounded-lg p-4">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {semana.conteudoCompleto}
                </ReactMarkdown>
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
};
