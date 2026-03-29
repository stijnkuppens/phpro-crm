-- 00011_jobs.sql
-- Generic job queue with webhook-based processing

CREATE TABLE public.jobs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type          text NOT NULL DEFAULT 'export',
  status        text NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  entity        text,
  format        text CHECK (format IN ('xlsx', 'csv')),
  filters       jsonb DEFAULT '{}'::jsonb,
  select_query  text,
  progress      integer DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  row_count     integer,
  file_path     text,
  file_size     bigint,
  error         text,
  requested_by  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at    timestamptz NOT NULL DEFAULT now(),
  started_at    timestamptz,
  completed_at  timestamptz
);

CREATE INDEX idx_jobs_requested_by ON public.jobs(requested_by);
CREATE INDEX idx_jobs_status ON public.jobs(status);
CREATE INDEX idx_jobs_created_at ON public.jobs(created_at DESC);

ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own jobs"
  ON public.jobs FOR SELECT
  USING (auth.uid() = requested_by);

GRANT SELECT ON public.jobs TO authenticated;
GRANT ALL ON public.jobs TO service_role;

ALTER PUBLICATION supabase_realtime ADD TABLE public.jobs;

-- ──────────────────────────────────────────────────
-- Helper: dispatch a job to its Edge Function via pg_net
-- Routes by job type → function name
-- ──────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.dispatch_job(p_job_id uuid, p_job_type text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_function_name text;
BEGIN
  -- Map job type to Edge Function name
  v_function_name := CASE p_job_type
    WHEN 'export' THEN 'process-export-jobs'
    -- Future: WHEN 'report' THEN 'process-report-jobs'
    -- Future: WHEN 'import' THEN 'process-import-jobs'
    ELSE NULL
  END;

  IF v_function_name IS NULL THEN
    RAISE WARNING 'Unknown job type: %', p_job_type;
    RETURN;
  END IF;

  PERFORM net.http_post(
    url := 'http://supabase-edge-functions:9000/functions/v1/' || v_function_name,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := jsonb_build_object('job_id', p_job_id)
  );
END;
$$;

-- ──────────────────────────────────────────────────
-- Trigger: auto-dispatch on new job
-- ──────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.trigger_process_job()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM public.dispatch_job(NEW.id, NEW.type);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_job_created
  AFTER INSERT ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_process_job();

-- ──────────────────────────────────────────────────
-- RPC: manual retry (called by retry button)
-- ──────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.trigger_job_retry(p_job_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_job_type text;
BEGIN
  SELECT type INTO v_job_type FROM public.jobs WHERE id = p_job_id;
  IF v_job_type IS NULL THEN
    RAISE EXCEPTION 'Job not found: %', p_job_id;
  END IF;
  PERFORM public.dispatch_job(p_job_id, v_job_type);
END;
$$;

REVOKE ALL ON FUNCTION public.trigger_job_retry(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.trigger_job_retry(uuid) TO service_role;
