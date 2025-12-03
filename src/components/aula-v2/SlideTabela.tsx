import { motion } from "framer-motion";
import { Table2 } from "lucide-react";
import { TabelaData } from "./types";

interface SlideTabelaProps {
  tabela: TabelaData;
  titulo?: string;
  conteudo?: string;
}

export const SlideTabela = ({ tabela, titulo, conteudo }: SlideTabelaProps) => {
  if (!tabela || !tabela.cabecalhos || !tabela.linhas) {
    return (
      <div className="text-muted-foreground text-center py-8">
        Tabela não disponível
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {/* Intro text if provided */}
      {conteudo && (
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-foreground leading-relaxed mb-4"
        >
          {conteudo}
        </motion.p>
      )}
      
      {/* Table container with scroll */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-x-auto rounded-xl border border-border"
      >
        <table className="w-full text-sm">
          {/* Header */}
          <thead>
            <tr className="bg-gradient-to-r from-cyan-500/20 to-teal-500/20">
              {tabela.cabecalhos.map((header, idx) => (
                <th 
                  key={idx}
                  className="px-4 py-3 text-left font-semibold text-foreground border-b border-border/50 first:rounded-tl-xl last:rounded-tr-xl"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          
          {/* Body */}
          <tbody>
            {tabela.linhas.map((linha, rowIdx) => (
              <motion.tr 
                key={rowIdx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + rowIdx * 0.05 }}
                className={`
                  ${rowIdx % 2 === 0 ? 'bg-card/30' : 'bg-card/60'}
                  hover:bg-primary/5 transition-colors
                `}
              >
                {linha.map((cell, cellIdx) => (
                  <td 
                    key={cellIdx}
                    className="px-4 py-3 text-muted-foreground border-b border-border/30"
                  >
                    {cell}
                  </td>
                ))}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </motion.div>
      
      {/* Table indicator */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="flex items-center gap-2 text-muted-foreground"
      >
        <Table2 className="w-4 h-4 text-cyan-400" />
        <span className="text-xs">Quadro comparativo para facilitar a memorização</span>
      </motion.div>
    </div>
  );
};
