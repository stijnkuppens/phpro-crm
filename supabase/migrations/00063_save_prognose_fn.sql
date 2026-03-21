-- Atomic delete+insert for prognose entries.
-- Accepts a year and a JSONB array of row objects.
-- Deletes existing revenue_entries for the client IDs present in the input,
-- then inserts the new rows — all within one implicit plpgsql transaction.

CREATE OR REPLACE FUNCTION save_prognose(
  p_year    integer,
  p_rows    jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_client_ids uuid[];
BEGIN
  -- Extract distinct client IDs from the input rows
  SELECT ARRAY(
    SELECT DISTINCT (elem->>'revenue_client_id')::uuid
    FROM jsonb_array_elements(p_rows) AS elem
    WHERE elem->>'revenue_client_id' IS NOT NULL
  )
  INTO v_client_ids;

  -- Delete existing rows for those clients + year
  IF array_length(v_client_ids, 1) > 0 THEN
    DELETE FROM revenue_entries
    WHERE revenue_client_id = ANY(v_client_ids)
      AND year = p_year;
  END IF;

  -- Insert new rows (caller skips zero-amount entries before calling)
  IF jsonb_array_length(p_rows) > 0 THEN
    INSERT INTO revenue_entries (
      revenue_client_id,
      division_id,
      service_name,
      year,
      month,
      amount
    )
    SELECT
      (elem->>'revenue_client_id')::uuid,
      (elem->>'division_id')::uuid,
      elem->>'service_name',
      (elem->>'year')::integer,
      (elem->>'month')::integer,
      (elem->>'amount')::numeric
    FROM jsonb_array_elements(p_rows) AS elem;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION save_prognose(integer, jsonb) TO authenticated;
