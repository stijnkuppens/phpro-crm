CREATE OR REPLACE FUNCTION get_consultant_stats()
RETURNS TABLE(bench_count bigint, active_count bigint, stopped_count bigint, max_revenue numeric)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT
    COUNT(*) FILTER (WHERE status = 'bench'),
    COUNT(*) FILTER (WHERE status = 'actief'),
    COUNT(*) FILTER (WHERE status = 'stopgezet'),
    COALESCE(SUM(
      COALESCE(
        (SELECT rate FROM consultant_rate_history WHERE consultant_id = consultants.id ORDER BY date DESC LIMIT 1),
        hourly_rate, 0
      ) * 8 * 21
    ) FILTER (WHERE status = 'actief'), 0)
  FROM consultants
  WHERE is_archived = false;
$$;

GRANT EXECUTE ON FUNCTION get_consultant_stats() TO authenticated;
