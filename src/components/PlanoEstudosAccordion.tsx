import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Calendar, Clock, BookMarked } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface DiaData {
  diaSemana: string;
  cargaHoraria?: string;
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
    return (
      <div className="text-center py-8 text-muted-foreground">
        <BookMarked className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>Nenhum cronograma encontrado</p>
      </div>
    );
  }

  return (
    <Accordion type="single" collapsible className="w-full space-y-3" defaultValue="semana-1">
      {semanas.map((semana) => (
        <AccordionItem 
          key={semana.numero} 
          value={`semana-${semana.numero}`}
          className="border-0 rounded-xl overflow-hidden bg-card shadow-md"
        >
          <AccordionTrigger className="px-4 py-4 hover:no-underline hover:bg-muted/50 transition-colors [&[data-state=open]>div>.badge]:bg-primary [&[data-state=open]>div>.badge]:text-primary-foreground">
            <div className="flex items-center gap-3 w-full">
              <Badge 
                variant="secondary" 
                className="badge shrink-0 font-bold transition-colors"
              >
                Semana {semana.numero}
              </Badge>
              <div className="flex flex-col items-start text-left flex-1 min-w-0">
                <span className="font-semibold text-foreground truncate w-full">
                  {semana.titulo || `Conteúdo da Semana ${semana.numero}`}
                </span>
                <span className="text-xs text-muted-foreground">
                  {semana.dias.length > 0 ? `${semana.dias.length} dias de estudo` : "Ver detalhes"}
                </span>
              </div>
            </div>
          </AccordionTrigger>
          
          <AccordionContent className="px-4 pb-4 pt-0">
            {semana.dias.length > 0 ? (
              <div className="space-y-3 mt-3">
                {semana.dias.map((dia, idx) => (
                  <div 
                    key={idx}
                    className="bg-muted/40 rounded-lg p-4 border border-border/30"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
                        <Calendar className="w-4 h-4 text-primary" />
                      </div>
                      <span className="font-semibold text-foreground">{dia.diaSemana}</span>
                      {dia.cargaHoraria && (
                        <Badge variant="outline" className="ml-auto text-xs gap-1">
                          <Clock className="w-3 h-3" />
                          {dia.cargaHoraria}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="prose prose-sm max-w-none dark:prose-invert text-muted-foreground pl-10">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {dia.conteudo}
                      </ReactMarkdown>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="prose prose-sm max-w-none dark:prose-invert mt-3 bg-muted/30 rounded-lg p-4 text-muted-foreground">
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
