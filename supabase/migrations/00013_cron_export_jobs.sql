-- ──────────────────────────────────────────────────
-- pg_cron: schedule export job processing every minute
-- ──────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Remove existing job if present (idempotent)
SELECT cron.unschedule('process-export-jobs')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'process-export-jobs');

SELECT cron.schedule(
  'process-export-jobs',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'http://supabase-edge-functions:9000/functions/v1/process-export-jobs',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
    ),
    body := '{}'::jsonb
  );
  $$
);
