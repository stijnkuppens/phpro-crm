-- ──────────────────────────────────────────────────
-- RPC wrappers for pgmq (callable by Edge Function via PostgREST)
-- ──────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.pgmq_read(
  queue_name text,
  vt integer,
  qty integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_agg(row_to_json(m))
  INTO result
  FROM pgmq.read(queue_name, vt, qty) m;

  RETURN COALESCE(result, '[]'::jsonb);
END;
$$;

CREATE OR REPLACE FUNCTION public.pgmq_archive(
  queue_name text,
  msg_id bigint
)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT pgmq.archive(queue_name, msg_id);
$$;

-- Only service_role can call these
REVOKE ALL ON FUNCTION public.pgmq_read(text, integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.pgmq_read(text, integer, integer) TO service_role;

REVOKE ALL ON FUNCTION public.pgmq_archive(text, bigint) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.pgmq_archive(text, bigint) TO service_role;
