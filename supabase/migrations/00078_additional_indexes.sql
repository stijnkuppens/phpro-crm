-- Trigram indexes for consultant and deal search
CREATE INDEX IF NOT EXISTS idx_consultants_first_name_trgm ON consultants USING gin (first_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_consultants_last_name_trgm ON consultants USING gin (last_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_consultants_client_name_trgm ON consultants USING gin (client_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_deals_title_trgm ON deals USING gin (title gin_trgm_ops);

-- Distinct countries RPC (replaces JS-side dedup in getAccountFilterOptions)
CREATE OR REPLACE FUNCTION get_distinct_account_countries()
RETURNS TABLE(country text)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT DISTINCT a.country
  FROM accounts a
  WHERE a.country IS NOT NULL
  ORDER BY a.country;
$$;

GRANT EXECUTE ON FUNCTION get_distinct_account_countries() TO authenticated;
