-- Criar tabela para cache dos mapas mentais dos artigos
CREATE TABLE public.mapas_mentais_artigos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_tabela TEXT NOT NULL,
  numero_artigo TEXT NOT NULL,
  conteudo_artigo TEXT NOT NULL,
  imagem_url TEXT,
  prompt_usado TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(codigo_tabela, numero_artigo)
);

-- Enable RLS
ALTER TABLE public.mapas_mentais_artigos ENABLE ROW LEVEL SECURITY;

-- Policy para leitura pública
CREATE POLICY "Mapas mentais são públicos para leitura" 
ON public.mapas_mentais_artigos 
FOR SELECT 
USING (true);

-- Policy para insert/update via service role (edge functions)
CREATE POLICY "Service role pode inserir mapas mentais" 
ON public.mapas_mentais_artigos 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Service role pode atualizar mapas mentais" 
ON public.mapas_mentais_artigos 
FOR UPDATE 
USING (true);

-- Trigger para updated_at
CREATE TRIGGER update_mapas_mentais_artigos_updated_at
BEFORE UPDATE ON public.mapas_mentais_artigos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Índice para busca rápida
CREATE INDEX idx_mapas_mentais_codigo_artigo ON public.mapas_mentais_artigos(codigo_tabela, numero_artigo);