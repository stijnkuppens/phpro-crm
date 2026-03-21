-- Fix: accounts table has no 'city' column. Remove client_city from the RPC function.

CREATE OR REPLACE FUNCTION public.link_consultant_to_account(
  p_consultant_id UUID,
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
SET search_path = public
AS $$
DECLARE
  v_consultant consultants%ROWTYPE;
  v_account_name TEXT;
  v_effective_role TEXT;
BEGIN
  -- 1. Validate hourly rate
  IF p_hourly_rate IS NULL OR p_hourly_rate <= 0 THEN
    RAISE EXCEPTION 'Uurtarief moet groter zijn dan 0';
  END IF;

  -- 2. Fetch consultant (lock row to prevent concurrent linking)
  SELECT * INTO v_consultant
  FROM consultants
  WHERE id = p_consultant_id AND status = 'bench' AND is_archived = false
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Consultant niet gevonden of niet beschikbaar';
  END IF;

  -- 3. Fetch account name for denormalized field
  SELECT name INTO v_account_name
  FROM accounts
  WHERE id = p_account_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Account niet gevonden';
  END IF;

  -- 4. Determine role: explicit > first bench role > null
  v_effective_role := COALESCE(p_role, v_consultant.roles[1]);

  -- 5. Update consultant: bench → actief
  UPDATE consultants SET
    status             = 'actief',
    account_id         = p_account_id,
    role               = v_effective_role,
    client_name        = v_account_name,
    start_date         = p_start_date,
    end_date           = CASE WHEN p_is_indefinite THEN NULL ELSE p_end_date END,
    is_indefinite      = p_is_indefinite,
    hourly_rate        = p_hourly_rate,
    sow_url            = p_sow_url,
    notice_period_days = p_notice_period_days,
    notes              = p_notes
  WHERE id = p_consultant_id;

  -- 6. Create initial rate history entry
  INSERT INTO consultant_rate_history (consultant_id, date, rate, reason)
  VALUES (p_consultant_id, p_start_date, p_hourly_rate, 'Initieel tarief');

  RETURN p_consultant_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.link_consultant_to_account TO authenticated;
