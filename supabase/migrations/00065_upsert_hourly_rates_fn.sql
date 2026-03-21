-- Atomic delete+insert for hourly_rates.
-- Accepts account_id, year, and a JSONB array of {role, rate} objects.
-- Deletes existing rows for that account+year, then inserts new rows —
-- all within one implicit plpgsql transaction so partial failure is impossible.

CREATE OR REPLACE FUNCTION public.upsert_hourly_rates(
  p_account_id UUID,
  p_year       INTEGER,
  p_rates      JSONB
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete existing rows for this account+year
  DELETE FROM hourly_rates
  WHERE account_id = p_account_id
    AND year = p_year;

  -- Insert new rows (no-op when array is empty)
  IF jsonb_array_length(p_rates) > 0 THEN
    INSERT INTO hourly_rates (account_id, year, role, rate)
    SELECT
      p_account_id,
      p_year,
      (elem->>'role'),
      (elem->>'rate')::numeric
    FROM jsonb_array_elements(p_rates) AS elem;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_hourly_rates(UUID, INTEGER, JSONB) TO authenticated;
