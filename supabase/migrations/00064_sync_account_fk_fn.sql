-- Atomic delete+insert for account FK junction tables.
-- Validates table_name against an explicit allow-list to prevent SQL injection.
-- Deletes all existing rows for the given account_id, then inserts new ones
-- — all within one implicit plpgsql transaction.

CREATE OR REPLACE FUNCTION sync_account_fk_relation(
  p_account_id  uuid,
  p_table       text,
  p_rows        jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_allowed text[] := ARRAY[
    'account_tech_stacks',
    'account_samenwerkingsvormen',
    'account_services',
    'account_manual_services'
  ];
BEGIN
  -- Guard against SQL injection via table name
  IF NOT (p_table = ANY(v_allowed)) THEN
    RAISE EXCEPTION 'Table "%" is not allowed for sync_account_fk_relation', p_table;
  END IF;

  -- Delete existing rows for this account
  EXECUTE format(
    'DELETE FROM %I WHERE account_id = $1',
    p_table
  ) USING p_account_id;

  -- Insert new rows
  IF jsonb_array_length(p_rows) > 0 THEN
    EXECUTE format(
      'INSERT INTO %I SELECT * FROM jsonb_populate_recordset(null::%I, $1)',
      p_table,
      p_table
    ) USING p_rows;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION sync_account_fk_relation(uuid, text, jsonb) TO authenticated;
