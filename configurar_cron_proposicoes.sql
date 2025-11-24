-- INSTRUÇÕES:
-- Execute este SQL no SQL Editor do Supabase Dashboard após rodar as migrations
-- Isso criará os cron jobs para atualização automática diária

-- Cron job para atualizar PLs diariamente às 6h da manhã
SELECT cron.schedule(
  'atualizar-proposicoes-recentes-diario',
  '0 6 * * *',
  $$
  SELECT net.http_post(
    url:='https://izspjvegxdfgkgibpyst.supabase.co/functions/v1/buscar-proposicoes-recentes',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6c3BqdmVneGRmZ2tnaWJweXN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxNDA2MTQsImV4cCI6MjA2MDcxNjYxNH0.LwTMbDH-S0mBoiIxfrSH2BpUMA7r4upOWWAb5a_If0Y"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
  $$
);

-- Cron job para atualizar PLPs diariamente às 6:30h da manhã
SELECT cron.schedule(
  'atualizar-plp-recentes-diario',
  '30 6 * * *',
  $$
  SELECT net.http_post(
    url:='https://izspjvegxdfgkgibpyst.supabase.co/functions/v1/buscar-plp-recentes',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6c3BqdmVneGRmZ2tnaWJweXN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxNDA2MTQsImV4cCI6MjA2MDcxNjYxNH0.LwTMbDH-S0mBoiIxfrSH2BpUMA7r4upOWWAb5a_If0Y"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
  $$
);

-- Cron job para limpar cache antigo todo domingo às 3h da manhã
SELECT cron.schedule(
  'limpar-cache-proposicoes',
  '0 3 * * 0',
  $$
  SELECT limpar_cache_proposicoes_antigo();
  $$
);

-- Verificar se os cron jobs foram criados com sucesso
SELECT * FROM cron.job WHERE jobname LIKE '%proposicoes%' OR jobname LIKE '%plp%';
