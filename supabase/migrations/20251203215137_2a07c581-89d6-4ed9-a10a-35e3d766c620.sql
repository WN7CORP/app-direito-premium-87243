-- Adicionar colunas de cache de áudio para comentário e exemplo
ALTER TABLE "QUESTOES_GERADAS" 
ADD COLUMN IF NOT EXISTS url_audio_comentario text,
ADD COLUMN IF NOT EXISTS url_audio_exemplo text;