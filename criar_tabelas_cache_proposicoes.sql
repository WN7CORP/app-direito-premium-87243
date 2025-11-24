-- INSTRUÇÕES:
-- Execute este SQL no SQL Editor do Supabase Dashboard
-- Isso criará todas as tabelas necessárias para o cache de proposições

-- ============================================
-- PARTE 1: CRIAR TABELAS
-- ============================================

-- Criar tabela cache_proposicoes_recentes
CREATE TABLE IF NOT EXISTS cache_proposicoes_recentes (
  id_proposicao INTEGER PRIMARY KEY,
  sigla_tipo TEXT NOT NULL,
  numero INTEGER,
  ano INTEGER,
  ementa TEXT,
  titulo_gerado_ia TEXT,
  autor_principal_nome TEXT,
  autor_principal_foto TEXT,
  data_apresentacao DATE,
  autores JSONB,
  votacoes JSONB,
  tramitacoes JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cache_proposicoes_tipo ON cache_proposicoes_recentes(sigla_tipo);
CREATE INDEX IF NOT EXISTS idx_cache_proposicoes_data ON cache_proposicoes_recentes(data_apresentacao DESC);
CREATE INDEX IF NOT EXISTS idx_cache_proposicoes_updated ON cache_proposicoes_recentes(updated_at DESC);

-- Criar tabela cache_plp_recentes
CREATE TABLE IF NOT EXISTS cache_plp_recentes (
  id_proposicao INTEGER PRIMARY KEY,
  sigla_tipo TEXT NOT NULL DEFAULT 'PLP',
  numero INTEGER,
  ano INTEGER,
  ementa TEXT,
  titulo_gerado_ia TEXT,
  autor_principal_nome TEXT,
  autor_principal_foto TEXT,
  data_apresentacao DATE,
  autores JSONB,
  votacoes JSONB,
  tramitacoes JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cache_plp_tipo ON cache_plp_recentes(sigla_tipo);
CREATE INDEX IF NOT EXISTS idx_cache_plp_data ON cache_plp_recentes(data_apresentacao DESC);
CREATE INDEX IF NOT EXISTS idx_cache_plp_updated ON cache_plp_recentes(updated_at DESC);

-- Criar tabela cache_proposicoes_progresso
CREATE TABLE IF NOT EXISTS cache_proposicoes_progresso (
  id SERIAL PRIMARY KEY,
  sigla_tipo TEXT NOT NULL,
  data DATE NOT NULL,
  ultima_pagina INTEGER DEFAULT 0,
  total_processados INTEGER DEFAULT 0,
  finalizado BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(sigla_tipo, data)
);

CREATE INDEX IF NOT EXISTS idx_progresso_tipo_data ON cache_proposicoes_progresso(sigla_tipo, data DESC);

-- ============================================
-- PARTE 2: CONFIGURAR RLS
-- ============================================

-- Configurar RLS - Permitir leitura pública
ALTER TABLE cache_proposicoes_recentes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir leitura pública proposicoes" ON cache_proposicoes_recentes;
CREATE POLICY "Permitir leitura pública proposicoes" ON cache_proposicoes_recentes FOR SELECT USING (true);

ALTER TABLE cache_plp_recentes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir leitura pública plp" ON cache_plp_recentes;
CREATE POLICY "Permitir leitura pública plp" ON cache_plp_recentes FOR SELECT USING (true);

ALTER TABLE cache_proposicoes_progresso ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir leitura pública progresso" ON cache_proposicoes_progresso;
CREATE POLICY "Permitir leitura pública progresso" ON cache_proposicoes_progresso FOR SELECT USING (true);

-- ============================================
-- PARTE 3: ATIVAR EXTENSÕES PARA CRON
-- ============================================

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ============================================
-- PARTE 4: CRIAR FUNÇÃO DE LIMPEZA
-- ============================================

CREATE OR REPLACE FUNCTION limpar_cache_proposicoes_antigo()
RETURNS void AS $$
BEGIN
  -- Deletar proposições com mais de 30 dias
  DELETE FROM cache_proposicoes_recentes 
  WHERE updated_at < NOW() - INTERVAL '30 days';
  
  DELETE FROM cache_plp_recentes 
  WHERE updated_at < NOW() - INTERVAL '30 days';
  
  -- Deletar progresso com mais de 7 dias
  DELETE FROM cache_proposicoes_progresso 
  WHERE data < CURRENT_DATE - INTERVAL '7 days';
  
  RAISE NOTICE 'Cache antigo limpo com sucesso';
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PARTE 5: CRIAR VIEW DE STATUS
-- ============================================

CREATE OR REPLACE VIEW vw_status_cache_proposicoes AS
SELECT 
  'PLs' as tipo,
  COUNT(*) as total,
  COUNT(CASE WHEN autor_principal_foto IS NOT NULL THEN 1 END) as com_foto,
  ROUND(COUNT(CASE WHEN autor_principal_foto IS NOT NULL THEN 1 END)::NUMERIC / NULLIF(COUNT(*)::NUMERIC, 0) * 100, 2) as percentual_foto,
  MAX(updated_at) as ultima_atualizacao,
  MIN(data_apresentacao) as data_mais_antiga,
  MAX(data_apresentacao) as data_mais_recente
FROM cache_proposicoes_recentes
WHERE sigla_tipo = 'PL'

UNION ALL

SELECT 
  'PLPs' as tipo,
  COUNT(*) as total,
  COUNT(CASE WHEN autor_principal_foto IS NOT NULL THEN 1 END) as com_foto,
  ROUND(COUNT(CASE WHEN autor_principal_foto IS NOT NULL THEN 1 END)::NUMERIC / NULLIF(COUNT(*)::NUMERIC, 0) * 100, 2) as percentual_foto,
  MAX(updated_at) as ultima_atualizacao,
  MIN(data_apresentacao) as data_mais_antiga,
  MAX(data_apresentacao) as data_mais_recente
FROM cache_plp_recentes;

-- ============================================
-- VERIFICAÇÃO
-- ============================================

-- Verificar se as tabelas foram criadas
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'cache_%';

-- Verificar se as extensões foram ativadas
SELECT * FROM pg_extension WHERE extname IN ('pg_cron', 'pg_net');
