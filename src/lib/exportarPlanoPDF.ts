import jsPDF from "jspdf";

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

interface PlanoParseado {
  objetivo: string;
  visaoGeral: string;
  semanas: SemanaData[];
  materiaisEstudo: string;
  estrategias: string;
  checklist: string;
  revisaoFinal: string;
  outrasSecoes: string;
}

interface ExportarPlanoPDFOptions {
  plano: PlanoParseado;
  materia: string;
  totalHoras?: number;
  dataGeracao?: string;
}

export const exportarPlanoPDF = ({
  plano,
  materia,
  totalHoras,
  dataGeracao = new Date().toLocaleDateString("pt-BR"),
}: ExportarPlanoPDFOptions) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let yPosition = margin;

  const addNewPageIfNeeded = (neededSpace: number = 20) => {
    if (yPosition + neededSpace > pageHeight - 30) {
      doc.addPage();
      yPosition = margin;
      return true;
    }
    return false;
  };

  const addText = (
    text: string,
    options: {
      fontSize?: number;
      fontStyle?: "normal" | "bold" | "italic";
      color?: [number, number, number];
      indent?: number;
    } = {}
  ) => {
    const {
      fontSize = 11,
      fontStyle = "normal",
      color = [51, 51, 51],
      indent = 0,
    } = options;

    doc.setFontSize(fontSize);
    doc.setFont("helvetica", fontStyle);
    doc.setTextColor(color[0], color[1], color[2]);

    const lines = doc.splitTextToSize(text, contentWidth - indent);
    lines.forEach((line: string) => {
      addNewPageIfNeeded(8);
      doc.text(line, margin + indent, yPosition);
      yPosition += fontSize * 0.4 + 2;
    });
  };

  const addSection = (title: string, icon: string = "") => {
    addNewPageIfNeeded(25);
    yPosition += 8;
    
    doc.setFillColor(245, 245, 250);
    doc.roundedRect(margin - 5, yPosition - 6, contentWidth + 10, 12, 2, 2, "F");
    
    addText(`${icon} ${title}`.trim(), {
      fontSize: 13,
      fontStyle: "bold",
      color: [59, 59, 59],
    });
    yPosition += 4;
  };

  const processMarkdownContent = (content: string, baseIndent: number = 0) => {
    const lines = content.split("\n");

    lines.forEach((line) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) {
        yPosition += 3;
        return;
      }

      // Headers (##, ###)
      if (trimmedLine.startsWith("### ")) {
        addNewPageIfNeeded(15);
        yPosition += 4;
        addText(trimmedLine.replace("### ", ""), {
          fontSize: 11,
          fontStyle: "bold",
          indent: baseIndent,
        });
        return;
      }

      if (trimmedLine.startsWith("## ")) {
        addNewPageIfNeeded(15);
        yPosition += 6;
        addText(trimmedLine.replace("## ", ""), {
          fontSize: 12,
          fontStyle: "bold",
          indent: baseIndent,
        });
        return;
      }

      // Bullet points
      if (trimmedLine.startsWith("- ") || trimmedLine.startsWith("• ")) {
        const bulletText = trimmedLine.replace(/^[-•]\s*/, "");
        const processedText = processInlineMarkdown(bulletText);
        addText(`• ${processedText}`, { indent: baseIndent + 5 });
        return;
      }

      // Checkbox items
      if (trimmedLine.startsWith("- [ ]") || trimmedLine.startsWith("- [x]")) {
        const isChecked = trimmedLine.startsWith("- [x]");
        const checkboxText = trimmedLine.replace(/^-\s*\[[ x]\]\s*/, "");
        const checkbox = isChecked ? "☑" : "☐";
        addText(`${checkbox} ${checkboxText}`, { indent: baseIndent + 5 });
        return;
      }

      // Numbered lists
      const numberedMatch = trimmedLine.match(/^(\d+)\.\s+(.+)/);
      if (numberedMatch) {
        addText(`${numberedMatch[1]}. ${processInlineMarkdown(numberedMatch[2])}`, {
          indent: baseIndent + 5,
        });
        return;
      }

      // Regular text with inline markdown
      const processedText = processInlineMarkdown(trimmedLine);
      addText(processedText, { indent: baseIndent });
    });
  };

  const processInlineMarkdown = (text: string): string => {
    // Remove ** for bold (jsPDF doesn't support inline bold easily)
    return text.replace(/\*\*([^*]+)\*\*/g, "$1").replace(/\*([^*]+)\*/g, "$1");
  };

  // ========== HEADER ==========
  doc.setFillColor(79, 70, 229); // Indigo
  doc.rect(0, 0, pageWidth, 45, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("PLANO DE ESTUDOS", pageWidth / 2, 18, { align: "center" });

  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  doc.text(materia, pageWidth / 2, 28, { align: "center" });

  doc.setFontSize(10);
  const metaInfo = `Data: ${dataGeracao}${totalHoras ? ` | Carga horária: ${totalHoras}h` : ""}`;
  doc.text(metaInfo, pageWidth / 2, 38, { align: "center" });

  yPosition = 55;

  // ========== OBJETIVO ==========
  if (plano.objetivo) {
    addSection("OBJETIVO", "🎯");
    processMarkdownContent(plano.objetivo);
  }

  // ========== VISÃO GERAL ==========
  if (plano.visaoGeral) {
    addSection("VISÃO GERAL", "📋");
    processMarkdownContent(plano.visaoGeral);
  }

  // ========== CRONOGRAMA SEMANAL ==========
  if (plano.semanas && plano.semanas.length > 0) {
    addSection("CRONOGRAMA SEMANAL", "📅");

    plano.semanas.forEach((semana, index) => {
      addNewPageIfNeeded(20);
      yPosition += 5;
      
      // Semana header
      doc.setFillColor(238, 242, 255);
      doc.roundedRect(margin, yPosition - 5, contentWidth, 10, 2, 2, "F");
      
      addText(`Semana ${index + 1}: ${semana.titulo}`, {
        fontSize: 11,
        fontStyle: "bold",
        color: [67, 56, 202],
      });
      yPosition += 3;

      // Dias da semana
      semana.dias.forEach((dia) => {
        addNewPageIfNeeded(15);
        addText(`📆 ${dia.diaSemana}`, {
          fontSize: 10,
          fontStyle: "bold",
          indent: 5,
        });

        // Parse conteudo para extrair tópicos
        const linhas = dia.conteudo.split('\n').filter(l => l.trim());
        linhas.forEach((linha) => {
          const textoLimpo = linha.replace(/^[-•*]\s*/, '').trim();
          if (textoLimpo) {
            addText(`• ${textoLimpo}`, {
              fontSize: 10,
              indent: 12,
              color: [71, 71, 71],
            });
          }
        });
        yPosition += 2;
      });
    });
  }

  // ========== MATERIAIS ==========
  if (plano.materiaisEstudo) {
    addSection("MATERIAIS DE ESTUDO", "📚");
    processMarkdownContent(plano.materiaisEstudo);
  }

  // ========== ESTRATÉGIAS ==========
  if (plano.estrategias) {
    addSection("ESTRATÉGIAS", "💡");
    processMarkdownContent(plano.estrategias);
  }

  // ========== CHECKLIST ==========
  if (plano.checklist) {
    addSection("CHECKLIST DE REVISÃO", "✅");
    processMarkdownContent(plano.checklist);
  }

  // ========== REVISÃO FINAL ==========
  if (plano.revisaoFinal) {
    addSection("REVISÃO FINAL", "🏁");
    processMarkdownContent(plano.revisaoFinal);
  }

  // ========== FOOTER (todas as páginas) ==========
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Página ${i} de ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: "center" }
    );
    doc.text(
      "Gerado por Direito Premium",
      pageWidth - margin,
      pageHeight - 10,
      { align: "right" }
    );
  }

  // Download
  const fileName = `plano-estudos-${materia.toLowerCase().replace(/\s+/g, "-")}.pdf`;
  doc.save(fileName);
};
