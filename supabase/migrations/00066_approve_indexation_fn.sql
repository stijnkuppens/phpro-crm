-- Atomic approval of an indexation draft.
-- Wraps all ~10 sequential writes in a single plpgsql transaction so that
-- a mid-flight failure leaves the database in a clean state.
--
-- Steps (mirrors approve-indexation.ts):
--   1. Fetch + lock draft (verifies it exists and is still in 'draft' status)
--   2. Mark draft as approved
--   3. Delete + insert hourly_rates for target_year
--   4. Upsert sla_rates; delete + insert sla_tools
--   5. Insert indexation_history + child tables
--   6. Delete the draft

CREATE OR REPLACE FUNCTION public.approve_indexation(
  p_draft_id   UUID,
  p_approved_by UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_draft          indexation_drafts%ROWTYPE;
  v_account_id     UUID;
  v_target_year    INTEGER;
  v_sla_rate_id    UUID;
  v_history_id     UUID;
BEGIN
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
