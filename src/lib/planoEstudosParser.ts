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

export function parsePlanoEstudos(markdown: string): PlanoParseado {
  const resultado: PlanoParseado = {
    objetivo: "",
    visaoGeral: "",
    semanas: [],
    materiaisEstudo: "",
    estrategias: "",
    checklist: "",
    revisaoFinal: "",
    outrasSecoes: "",
  };

  // Extrair Objetivo - mais flexível
  const objetivoMatch = markdown.match(/##?\s*(?:🎯\s*)?Objetivo[^\n]*\n([\s\S]*?)(?=\n##|\n\*\*Semana|$)/i);
  if (objetivoMatch) {
    resultado.objetivo = objetivoMatch[1].trim();
  }

  // Extrair Visão Geral - mais flexível
  const visaoMatch = markdown.match(/##?\s*(?:📋\s*)?Visão Geral[^\n]*\n([\s\S]*?)(?=\n##|\n\*\*Semana|$)/i);
  if (visaoMatch) {
    resultado.visaoGeral = visaoMatch[1].trim();
  }

  // Extrair Cronograma - aceita "Detalhado" e outras variações
  const cronogramaMatch = markdown.match(/##?\s*(?:📅\s*)?Cronograma\s*(?:Semanal|Detalhado)?[^\n]*\n([\s\S]*?)(?=\n##\s*(?:📚|Materiais|💡|Estratégias|✅|Checklist|🔄|Revisão)|$)/i);
  
  if (cronogramaMatch) {
    const cronogramaCompleto = cronogramaMatch[1];
    
    // Regex para semanas - aceita ### ou ** no início
    const semanasRegex = /(?:###\s*(?:📌\s*)?|\*\*)Semana\s*(\d+)[:\s\-–]*([^\n*]*?)(?:\*\*)?(?:\n|$)([\s\S]*?)(?=(?:###\s*(?:📌\s*)?|\*\*)Semana\s*\d+|$)/gi;
    let semanaMatch;
    
    while ((semanaMatch = semanasRegex.exec(cronogramaCompleto)) !== null) {
      const numero = parseInt(semanaMatch[1]);
      const titulo = semanaMatch[2].trim().replace(/\*\*/g, '');
      const conteudoSemana = semanaMatch[3];
      
      // Extrair dias - aceita **Segunda-feira (8h)** ou **Segunda-feira:**
      const dias: DiaData[] = [];
      const diasRegex = /\*\*([A-Za-zçÇáéíóúâêîôûãõ-]+[-\s]?feira)(?:\s*\(([^)]+)\))?\s*:?\*\*[:\s]*([\s\S]*?)(?=\*\*[A-Za-zçÇáéíóúâêîôûãõ-]+[-\s]?feira|\*\*Semana|$)/gi;
      let diaMatch;
      
      while ((diaMatch = diasRegex.exec(conteudoSemana)) !== null) {
        dias.push({
          diaSemana: diaMatch[1].trim(),
          cargaHoraria: diaMatch[2]?.trim() || undefined,
          conteudo: diaMatch[3].trim(),
        });
      }
      
      resultado.semanas.push({
        numero,
        titulo,
        dias,
        conteudoCompleto: conteudoSemana.trim(),
      });
    }
  }

  // Extrair Materiais de Estudo
  const materiaisMatch = markdown.match(/##?\s*(?:📚\s*)?Materiais\s*(?:de\s*Estudo)?[^\n]*\n([\s\S]*?)(?=\n##|$)/i);
  if (materiaisMatch) {
    resultado.materiaisEstudo = materiaisMatch[1].trim();
  }

  // Extrair Estratégias
  const estrategiasMatch = markdown.match(/##?\s*(?:💡\s*)?Estratégias[^\n]*\n([\s\S]*?)(?=\n##|$)/i);
  if (estrategiasMatch) {
    resultado.estrategias = estrategiasMatch[1].trim();
  }

  // Extrair Checklist
  const checklistMatch = markdown.match(/##?\s*(?:✅\s*)?Checklist[^\n]*\n([\s\S]*?)(?=\n##|$)/i);
  if (checklistMatch) {
    resultado.checklist = checklistMatch[1].trim();
  }

  // Extrair Revisão Final
  const revisaoMatch = markdown.match(/##?\s*(?:🔄\s*)?Revisão\s*Final[^\n]*\n([\s\S]*?)(?=\n##|$)/i);
  if (revisaoMatch) {
    resultado.revisaoFinal = revisaoMatch[1].trim();
  }

  return resultado;
}
