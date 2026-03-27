/*
  Migration: Application RPC functions

  Creates all custom PostgreSQL functions used by the application:
  - SECURITY DEFINER functions for atomic multi-table mutations
  - STABLE query functions for dashboard/banner statistics

  Every SECURITY DEFINER function includes:
  1. SET search_path = public (prevents search_path hijacking)
  2. Auth guard (checks user role before executing)
*/

-- ── 1. link_consultant_to_account ───────────────────────────────────────────
-- Atomic transition: updates consultant from bench → actief, sets account/deal
-- fields, creates initial rate history entry.

CREATE OR REPLACE FUNCTION public.link_consultant_to_account(
  p_consultant_id      UUID,
  p_account_id         UUID,
  p_role               TEXT    DEFAULT NULL,
  p_start_date         DATE    DEFAULT NULL,
  p_end_date           DATE    DEFAULT NULL,
  p_is_indefinite      BOOLEAN DEFAULT FALSE,
  p_hourly_rate        NUMERIC DEFAULT 0,
  p_notice_period_days INTEGER DEFAULT 30,
  p_sow_url            TEXT    DEFAULT NULL,
  p_notes              TEXT    DEFAULT NULL
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

-- ── 2. sync_account_fk_relation ─────────────────────────────────────────────
-- Generic delete-then-insert for account junction tables.
-- Validates table name against an explicit allow-list to prevent SQL injection.

CREATE OR REPLACE FUNCTION public.sync_account_fk_relation(
  p_account_id  uuid,
  p_table       text,
  p_rows        jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role    text;
  v_allowed text[] := ARRAY[
    'account_tech_stacks',
    'account_samenwerkingsvormen',
    'account_services',
    'account_manual_services'
  ];
  v_cols  text;
  v_vals  text;
  v_keys  text[];
  v_key   text;
BEGIN
  -- Auth guard: only admin and sales_manager may call this function
  SELECT role INTO v_role FROM user_profiles WHERE id = (SELECT auth.uid());
  IF v_role NOT IN ('admin', 'sales_manager') THEN
    RAISE EXCEPTION 'Insufficient permissions';
  END IF;

  -- Guard against SQL injection via table name
  IF NOT (p_table = ANY(v_allowed)) THEN
    RAISE EXCEPTION 'Table "%" is not allowed for sync_account_fk_relation', p_table;
  END IF;

  -- Delete existing rows for this account
  EXECUTE format(
    'DELETE FROM %I WHERE account_id = $1',
    p_table
  ) USING p_account_id;

  -- Insert new rows using only the keys present in the JSON objects,
  -- so that columns with DEFAULT values (id, created_at, updated_at) are omitted
  -- and their defaults fire correctly.
  IF jsonb_array_length(p_rows) > 0 THEN
    -- Extract column names from the first JSON object
    SELECT array_agg(k ORDER BY k) INTO v_keys FROM jsonb_object_keys(p_rows->0) AS k;

    -- Build column list and value extraction expressions
    SELECT
      string_agg(format('%I', k), ', ' ORDER BY k),
      string_agg(format('(elem->>%L)::%s', k, col.data_type_cast), ', ' ORDER BY k)
    INTO v_cols, v_vals
    FROM unnest(v_keys) AS k
    LEFT JOIN LATERAL (
      SELECT CASE c.udt_name
        WHEN 'uuid' THEN 'uuid'
        WHEN 'timestamptz' THEN 'timestamptz'
        WHEN 'timestamp' THEN 'timestamp'
        ELSE 'text'
      END AS data_type_cast
      FROM information_schema.columns c
      WHERE c.table_schema = 'public' AND c.table_name = p_table AND c.column_name = k
    ) col ON true;

    EXECUTE format(
      'INSERT INTO %I (%s) SELECT %s FROM jsonb_array_elements($1) AS elem',
      p_table, v_cols, v_vals
    ) USING p_rows;
  END IF;
END;
$$;

-- ── 4. upsert_hourly_rates ─────────────────────────────────────────────────
-- Atomic delete-then-insert for hourly_rates by account+year.

CREATE OR REPLACE FUNCTION public.upsert_hourly_rates(
  p_account_id UUID,
  p_year       INTEGER,
  p_rates      JSONB
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
BEGIN
  -- Auth guard: only admin and sales_manager may call this function
  SELECT role INTO v_role FROM user_profiles WHERE id = (SELECT auth.uid());
  IF v_role NOT IN ('admin', 'sales_manager') THEN
    RAISE EXCEPTION 'Insufficient permissions';
  END IF;

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

-- ── 5. approve_indexation ───────────────────────────────────────────────────
-- Multi-step atomic transaction: validates draft, applies rates, updates SLA,
-- logs history, finalizes draft, creates notification.

CREATE OR REPLACE FUNCTION public.approve_indexation(
  p_draft_id    UUID,
  p_approved_by UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- ── 6. get_open_deal_value ──────────────────────────────────────────────────
-- Returns the weighted sum of open deal values (amount * probability).
-- NOT security definer — reads through RLS.

CREATE OR REPLACE FUNCTION public.get_open_deal_value()
RETURNS numeric
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(SUM(amount * probability::numeric / 100), 0)
  FROM deals WHERE closed_at IS NULL;
$$;

-- ── 7. get_consultant_stats ─────────────────────────────────────────────────
-- Returns bench/active/stopped counts and max potential monthly revenue.

CREATE OR REPLACE FUNCTION public.get_consultant_stats()
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

-- ── 8. get_distinct_account_countries ────────────────────────────────────────
-- Returns distinct non-null country values from accounts table.

CREATE OR REPLACE FUNCTION public.get_distinct_account_countries()
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

-- ── 9. get_account_banner_stats ─────────────────────────────────────────────
-- Returns consultant/contact/deal/activity counts, pipeline value, and monthly
-- revenue for the account detail page banner.

CREATE OR REPLACE FUNCTION public.get_account_banner_stats(p_account_id uuid)
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

-- ── Grants ──────────────────────────────────────────────────────────────────

GRANT EXECUTE ON FUNCTION public.link_consultant_to_account TO authenticated;
GRANT EXECUTE ON FUNCTION public.sync_account_fk_relation(uuid, text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_hourly_rates(UUID, INTEGER, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_indexation(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_open_deal_value() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_consultant_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_distinct_account_countries() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_account_banner_stats(uuid) TO authenticated;

-- NOTE: REVOKE INSERT on notifications/audit_logs is handled in 00001_foundation.sql
