-- ============================================================================
-- Migration: RPC auth guards for SECURITY DEFINER functions
-- All SECURITY DEFINER functions bypass RLS. Without an internal auth check,
-- any authenticated user can call them directly via supabase.rpc() from the
-- browser, bypassing server action permission checks entirely.
-- ============================================================================

-- ── 1. save_prognose — restricted to admin and sales_manager ─────────────────
CREATE OR REPLACE FUNCTION save_prognose(
  p_year    integer,
  p_rows    jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_role       text;
  v_client_ids uuid[];
BEGIN
  -- Auth guard: only admin and sales_manager may call this function
  SELECT role INTO v_role FROM user_profiles WHERE id = (SELECT auth.uid());
  IF v_role NOT IN ('admin', 'sales_manager') THEN
    RAISE EXCEPTION 'Insufficient permissions';
  END IF;

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

-- ── 2. approve_indexation — restricted to admin and sales_manager ────────────
CREATE OR REPLACE FUNCTION public.approve_indexation(
  p_draft_id   UUID,
  p_approved_by UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_role           text;
  v_draft          indexation_drafts%ROWTYPE;
  v_account_id     UUID;
  v_target_year    INTEGER;
  v_sla_rate_id    UUID;
  v_history_id     UUID;
BEGIN
  -- Auth guard: only admin and sales_manager may call this function
  SELECT role INTO v_role FROM user_profiles WHERE id = (SELECT auth.uid());
  IF v_role NOT IN ('admin', 'sales_manager') THEN
    RAISE EXCEPTION 'Insufficient permissions';
  END IF;

  -- 1. Lock the draft row and verify status
  SELECT * INTO v_draft
  FROM indexation_drafts
  WHERE id = p_draft_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Indexation draft not found: %', p_draft_id;
  END IF;

  IF v_draft.status <> 'draft' THEN
    RAISE EXCEPTION 'Draft is not in draft status (current: %)', v_draft.status;
  END IF;

  v_account_id  := v_draft.account_id;
  v_target_year := v_draft.target_year;

  -- 2. Mark as approved
  UPDATE indexation_drafts
  SET status = 'approved', approved_by = p_approved_by
  WHERE id = p_draft_id;

  -- 3. Replace hourly_rates for target_year
  DELETE FROM hourly_rates
  WHERE account_id = v_account_id
    AND year = v_target_year;

  INSERT INTO hourly_rates (account_id, year, role, rate)
  SELECT v_account_id, v_target_year, r.role, r.proposed_rate
  FROM indexation_draft_rates r
  WHERE r.draft_id = p_draft_id;

  -- 4. Upsert sla_rates + sync sla_tools (only when a draft SLA row exists)
  IF EXISTS (SELECT 1 FROM indexation_draft_sla WHERE draft_id = p_draft_id) THEN
    INSERT INTO sla_rates (account_id, year, fixed_monthly_rate, support_hourly_rate)
    SELECT v_account_id, v_target_year, s.fixed_monthly_rate, s.support_hourly_rate
    FROM indexation_draft_sla s
    WHERE s.draft_id = p_draft_id
    ON CONFLICT (account_id, year) DO UPDATE
      SET fixed_monthly_rate    = EXCLUDED.fixed_monthly_rate,
          support_hourly_rate   = EXCLUDED.support_hourly_rate
    RETURNING id INTO v_sla_rate_id;

    DELETE FROM sla_tools
    WHERE sla_rate_id = v_sla_rate_id;

    INSERT INTO sla_tools (sla_rate_id, tool_name, monthly_price)
    SELECT v_sla_rate_id, t.tool_name, t.proposed_price
    FROM indexation_draft_sla_tools t
    WHERE t.draft_id = p_draft_id;
  END IF;

  -- 5. Create indexation_history entry
  INSERT INTO indexation_history (
    account_id,
    target_year,
    percentage,
    info,
    adjustment_pct_hourly,
    adjustment_pct_sla
  )
  VALUES (
    v_account_id,
    v_draft.target_year,
    v_draft.percentage,
    v_draft.info,
    v_draft.adjustment_pct_hourly,
    v_draft.adjustment_pct_sla
  )
  RETURNING id INTO v_history_id;

  -- 5a. History rates
  INSERT INTO indexation_history_rates (history_id, role, rate)
  SELECT v_history_id, r.role, r.proposed_rate
  FROM indexation_draft_rates r
  WHERE r.draft_id = p_draft_id;

  -- 5b. History SLA + tools (only when a draft SLA row exists)
  IF EXISTS (SELECT 1 FROM indexation_draft_sla WHERE draft_id = p_draft_id) THEN
    INSERT INTO indexation_history_sla (history_id, fixed_monthly_rate, support_hourly_rate)
    SELECT v_history_id, s.fixed_monthly_rate, s.support_hourly_rate
    FROM indexation_draft_sla s
    WHERE s.draft_id = p_draft_id;

    INSERT INTO indexation_history_sla_tools (history_id, tool_name, price)
    SELECT v_history_id, t.tool_name, t.proposed_price
    FROM indexation_draft_sla_tools t
    WHERE t.draft_id = p_draft_id;
  END IF;

  -- 6. Delete the draft (cascades to draft_rates, draft_sla, draft_sla_tools via FK)
  DELETE FROM indexation_drafts WHERE id = p_draft_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.approve_indexation(UUID, UUID) TO authenticated;

-- ── 3. link_consultant_to_account — restricted to admin, sales_manager, customer_success ──
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
  v_role           text;
  v_consultant     consultants%ROWTYPE;
  v_account_name   TEXT;
  v_effective_role TEXT;
BEGIN
  -- Auth guard: only admin, sales_manager, and customer_success may call this function
  SELECT role INTO v_role FROM user_profiles WHERE id = (SELECT auth.uid());
  IF v_role NOT IN ('admin', 'sales_manager', 'customer_success') THEN
    RAISE EXCEPTION 'Insufficient permissions';
  END IF;

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

-- ── 4. get_open_deal_value — remove SECURITY DEFINER (reads own data via RLS) ──
-- This function only reads deals, which are already protected by RLS.
-- SECURITY DEFINER is unnecessary here and widens the trust boundary.
CREATE OR REPLACE FUNCTION public.get_open_deal_value()
RETURNS numeric LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT COALESCE(SUM(amount * probability::numeric / 100), 0)
  FROM deals WHERE closed_at IS NULL;
$$;

GRANT EXECUTE ON FUNCTION public.get_open_deal_value() TO authenticated;

-- ── 5. Revoke dangerous direct-insert grants ─────────────────────────────────
-- notifications and audit_logs should only be written by server-side functions,
-- never directly by authenticated users via the browser client.
REVOKE INSERT ON public.notifications FROM authenticated;
REVOKE INSERT ON public.audit_logs FROM authenticated;
