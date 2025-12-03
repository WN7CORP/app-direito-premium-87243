-- Criar tabela para cache global de áudios de feedback
CREATE TABLE public."AUDIO_FEEDBACK_CACHE" (
  id SERIAL PRIMARY KEY,
  tipo TEXT UNIQUE NOT NULL, -- 'resposta_correta' ou 'resposta_incorreta'
  url_audio TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public."AUDIO_FEEDBACK_CACHE" ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura pública (áudios de feedback são públicos)
CREATE POLICY "Áudios de feedback são públicos para leitura"
ON public."AUDIO_FEEDBACK_CACHE"
FOR SELECT
USING (true);