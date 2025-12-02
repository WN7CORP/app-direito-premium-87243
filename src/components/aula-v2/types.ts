// Types for the new interactive lesson system v2

export interface TermoDefinicao {
  termo: string;
  definicao: string;
}

export interface TopicoDetalhe {
  titulo: string;
  detalhe: string;
}

export interface SlideContent {
  tipo: 'texto' | 'termos' | 'explicacao' | 'atencao' | 'exemplo' | 'quickcheck';
  titulo?: string;
  conteudo: string;
  icone?: string;
  // For termos slides
  termos?: TermoDefinicao[];
  // For explicacao slides with detailed topics
  topicos?: TopicoDetalhe[];
  // For exemplo slides
  contexto?: string; // e.g., "Situação cotidiana" or "Jurisprudência"
  // For quickcheck slides
  pergunta?: string;
  opcoes?: string[];
  resposta?: number;
  feedback?: string;
}

export interface Secao {
  id: number;
  tipo: 'caput' | 'inciso' | 'paragrafo' | 'alinea' | 'item';
  trechoOriginal: string;
  titulo?: string;
  slides: SlideContent[];
}

export interface AtividadesFinais {
  matching: Array<{ termo: string; definicao: string }>;
  flashcards: Array<{ frente: string; verso: string; exemplo?: string }>;
  questoes: Array<{
    question: string;
    options: string[];
    correctAnswer: number;
    explicacao: string;
    fonte?: string;
  }>;
}

export interface AulaEstruturaV2 {
  versao: 2;
  titulo: string;
  tempoEstimado: string;
  objetivos: string[];
  secoes: Secao[];
  atividadesFinais: AtividadesFinais;
  provaFinal: Array<{
    question: string;
    options: string[];
    correctAnswer: number;
    explicacao: string;
    tempoLimite?: number;
  }>;
}

export type EtapaAulaV2 = 
  | 'loading' 
  | 'intro' 
  | 'secao' 
  | 'matching' 
  | 'flashcards' 
  | 'quiz' 
  | 'provaFinal' 
  | 'resultado';
