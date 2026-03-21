-- Atomic function to link a bench consultant to an account.
-- Creates active_consultant + initial rate history + archives bench consultant
-- in a single transaction. If any step fails, everything rolls back.

CREATE OR REPLACE FUNCTION public.link_bench_to_account(
  p_bench_consultant_id UUID,
  p_account_id UUID,
  p_role TEXT DEFAULT NULL,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL,
  p_is_indefinite BOOLEAN DEFAULT FALSE,
  p_hourly_rate NUMERIC DEFAULT 0,
  p_notice_period_days INTEGER DEFAULT 30,
  p_sow_url TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_bench bench_consultants%ROWTYPE;
  v_account_name TEXT;
  v_consultant_id UUID;
  v_effective_role TEXT;
BEGIN
  -- 1. Fetch bench consultant (lock row to prevent concurrent linking)
  SELECT * INTO v_bench
  FROM bench_consultants
  WHERE id = p_bench_consultant_id AND is_archived = false
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Bench consultant niet gevonden of al gearchiveerd';
  END IF;

  -- 2. Fetch account name for denormalized field
  SELECT name INTO v_account_name
  FROM accounts
  WHERE id = p_account_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Account niet gevonden';
  END IF;

  -- 3. Determine role: explicit > first bench role > null
  v_effective_role := COALESCE(p_role, v_bench.roles[1]);

  -- 4. Create active consultant
  INSERT INTO active_consultants (
    account_id, first_name, last_name, role, city, cv_pdf_url,
    client_name, client_city, start_date, end_date, is_indefinite,
    hourly_rate, sow_url, notice_period_days, notes, is_active, is_stopped
  ) VALUES (
    p_account_id, v_bench.first_name, v_bench.last_name, v_effective_role,
    v_bench.city, v_bench.cv_pdf_url, v_account_name, NULL,
    p_start_date, CASE WHEN p_is_indefinite THEN NULL ELSE p_end_date END,
    p_is_indefinite, p_hourly_rate, p_sow_url, p_notice_period_days,
    p_notes, true, false
  )
  RETURNING id INTO v_consultant_id;

  -- 5. Create initial rate history entry
  INSERT INTO consultant_rate_history (active_consultant_id, date, rate, reason)
  VALUES (v_consultant_id, p_start_date, p_hourly_rate, 'Initieel tarief');

  -- 6. Archive the bench consultant
  UPDATE bench_consultants
  SET is_archived = true
  WHERE id = p_bench_consultant_id;

  RETURN v_consultant_id;
END;
$$;

-- Grant execute to authenticated users (RLS on underlying tables still applies
-- for reads, but SECURITY DEFINER bypasses for the writes inside the function)
GRANT EXECUTE ON FUNCTION public.link_bench_to_account TO authenticated;
