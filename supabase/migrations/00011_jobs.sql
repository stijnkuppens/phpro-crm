-- 00011_jobs.sql
-- Job queue infrastructure: jobs table + pgmq export queue

CREATE EXTENSION IF NOT EXISTS pgmq;

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

SELECT pgmq.create('export_jobs');

CREATE OR REPLACE FUNCTION public.enqueue_export_job(p_job_id uuid)
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pgmq
AS $$
  SELECT pgmq.send('export_jobs', jsonb_build_object('job_id', p_job_id));
$$;

REVOKE ALL ON FUNCTION public.enqueue_export_job(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.enqueue_export_job(uuid) TO service_role;
