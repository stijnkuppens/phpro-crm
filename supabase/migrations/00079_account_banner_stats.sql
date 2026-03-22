CREATE OR REPLACE FUNCTION get_account_banner_stats(p_account_id uuid)
RETURNS TABLE(
  consultant_count bigint,
  contact_count bigint,
  deal_count bigint,
  activity_count bigint,
  pipeline_value numeric,
  monthly_revenue numeric
)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT
    (SELECT COUNT(*) FROM consultants WHERE account_id = p_account_id AND status = 'actief' AND NOT is_archived),
    (SELECT COUNT(*) FROM contacts WHERE account_id = p_account_id),
    (SELECT COUNT(*) FROM deals WHERE account_id = p_account_id AND closed_at IS NULL),
    (SELECT COUNT(*) FROM activities WHERE account_id = p_account_id),
    COALESCE((SELECT SUM(amount) FROM deals WHERE account_id = p_account_id AND closed_at IS NULL), 0),
    COALESCE((
      SELECT SUM(
        COALESCE(
          (SELECT rate FROM consultant_rate_history WHERE consultant_id = c.id ORDER BY date DESC LIMIT 1),
          c.hourly_rate, 0
        ) * 8 * 21
      )
      FROM consultants c
      WHERE c.account_id = p_account_id AND c.status = 'actief' AND NOT c.is_archived
    ), 0);
$$;

GRANT EXECUTE ON FUNCTION get_account_banner_stats(uuid) TO authenticated;
