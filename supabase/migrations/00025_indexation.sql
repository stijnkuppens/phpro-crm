-- ============================================================================
-- Migration: Indexation
-- NOTE: indexation_indices already exists from Layer 1 — not recreated here
-- ============================================================================

-- ── indexation_config ────────────────────────────────────────────────────────
CREATE TABLE indexation_config (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id        uuid NOT NULL UNIQUE REFERENCES accounts(id) ON DELETE CASCADE,
  indexation_type   text,
  start_month       int,
  start_year        int,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON indexation_config
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE indexation_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "indexation_config_select" ON indexation_config FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "indexation_config_write" ON indexation_config FOR ALL TO authenticated
  USING (get_user_role() IN ('admin', 'sales_manager'))
  WITH CHECK (get_user_role() IN ('admin', 'sales_manager'));

GRANT INSERT, UPDATE, DELETE ON public.indexation_config TO authenticated;

-- ── indexation_drafts ────────────────────────────────────────────────────────
CREATE TABLE indexation_drafts (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id              uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  target_year             int NOT NULL,
  base_year               int NOT NULL,
  percentage              numeric NOT NULL,
  status                  text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'rejected')),
  info                    text,
  adjustment_pct_hourly   numeric,
  adjustment_pct_sla      numeric,
  created_by              uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  approved_by             uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON indexation_drafts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_indexation_drafts_account ON indexation_drafts(account_id);
CREATE INDEX idx_indexation_drafts_status ON indexation_drafts(status);

ALTER TABLE indexation_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "indexation_drafts_select" ON indexation_drafts FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "indexation_drafts_insert" ON indexation_drafts FOR INSERT TO authenticated
  WITH CHECK (get_user_role() IN ('admin', 'sales_manager'));
CREATE POLICY "indexation_drafts_update" ON indexation_drafts FOR UPDATE TO authenticated
  USING (get_user_role() IN ('admin', 'sales_manager'))
  WITH CHECK (get_user_role() IN ('admin', 'sales_manager'));
CREATE POLICY "indexation_drafts_delete" ON indexation_drafts FOR DELETE TO authenticated
  USING (get_user_role() IN ('admin', 'sales_manager'));

GRANT INSERT, UPDATE, DELETE ON public.indexation_drafts TO authenticated;

-- ── indexation_draft_rates ───────────────────────────────────────────────────
CREATE TABLE indexation_draft_rates (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  draft_id        uuid NOT NULL REFERENCES indexation_drafts(id) ON DELETE CASCADE,
  role            text NOT NULL,
  current_rate    numeric NOT NULL,
  proposed_rate   numeric NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON indexation_draft_rates
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_indexation_draft_rates_draft ON indexation_draft_rates(draft_id);

ALTER TABLE indexation_draft_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "indexation_draft_rates_select" ON indexation_draft_rates FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "indexation_draft_rates_write" ON indexation_draft_rates FOR ALL TO authenticated
  USING (get_user_role() IN ('admin', 'sales_manager'))
  WITH CHECK (get_user_role() IN ('admin', 'sales_manager'));

GRANT INSERT, UPDATE, DELETE ON public.indexation_draft_rates TO authenticated;

-- ── indexation_draft_sla ─────────────────────────────────────────────────────
CREATE TABLE indexation_draft_sla (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  draft_id              uuid NOT NULL UNIQUE REFERENCES indexation_drafts(id) ON DELETE CASCADE,
  fixed_monthly_rate    numeric NOT NULL DEFAULT 0,
  support_hourly_rate   numeric NOT NULL DEFAULT 0,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON indexation_draft_sla
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE indexation_draft_sla ENABLE ROW LEVEL SECURITY;

CREATE POLICY "indexation_draft_sla_select" ON indexation_draft_sla FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "indexation_draft_sla_write" ON indexation_draft_sla FOR ALL TO authenticated
  USING (get_user_role() IN ('admin', 'sales_manager'))
  WITH CHECK (get_user_role() IN ('admin', 'sales_manager'));

GRANT INSERT, UPDATE, DELETE ON public.indexation_draft_sla TO authenticated;

-- ── indexation_draft_sla_tools ───────────────────────────────────────────────
CREATE TABLE indexation_draft_sla_tools (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  draft_id        uuid NOT NULL REFERENCES indexation_drafts(id) ON DELETE CASCADE,
  tool_name       text NOT NULL,
  proposed_price  numeric NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON indexation_draft_sla_tools
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_indexation_draft_sla_tools_draft ON indexation_draft_sla_tools(draft_id);

ALTER TABLE indexation_draft_sla_tools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "indexation_draft_sla_tools_select" ON indexation_draft_sla_tools FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "indexation_draft_sla_tools_write" ON indexation_draft_sla_tools FOR ALL TO authenticated
  USING (get_user_role() IN ('admin', 'sales_manager'))
  WITH CHECK (get_user_role() IN ('admin', 'sales_manager'));

GRANT INSERT, UPDATE, DELETE ON public.indexation_draft_sla_tools TO authenticated;

-- ── indexation_history ───────────────────────────────────────────────────────
CREATE TABLE indexation_history (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id              uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  date                    date NOT NULL DEFAULT CURRENT_DATE,
  target_year             int NOT NULL,
  percentage              numeric NOT NULL,
  scenario                text,
  info                    text,
  adjustment_pct_hourly   numeric,
  adjustment_pct_sla      numeric,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON indexation_history
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_indexation_history_account ON indexation_history(account_id);

ALTER TABLE indexation_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "indexation_history_select" ON indexation_history FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "indexation_history_write" ON indexation_history FOR ALL TO authenticated
  USING (get_user_role() IN ('admin', 'sales_manager'))
  WITH CHECK (get_user_role() IN ('admin', 'sales_manager'));

GRANT INSERT, UPDATE, DELETE ON public.indexation_history TO authenticated;

-- ── indexation_history_rates ─────────────────────────────────────────────────
CREATE TABLE indexation_history_rates (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  history_id      uuid NOT NULL REFERENCES indexation_history(id) ON DELETE CASCADE,
  role            text NOT NULL,
  rate            numeric NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON indexation_history_rates
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_indexation_history_rates_history ON indexation_history_rates(history_id);

ALTER TABLE indexation_history_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "indexation_history_rates_select" ON indexation_history_rates FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "indexation_history_rates_write" ON indexation_history_rates FOR ALL TO authenticated
  USING (get_user_role() IN ('admin', 'sales_manager'))
  WITH CHECK (get_user_role() IN ('admin', 'sales_manager'));

GRANT INSERT, UPDATE, DELETE ON public.indexation_history_rates TO authenticated;

-- ── indexation_history_sla ───────────────────────────────────────────────────
CREATE TABLE indexation_history_sla (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  history_id            uuid NOT NULL UNIQUE REFERENCES indexation_history(id) ON DELETE CASCADE,
  fixed_monthly_rate    numeric NOT NULL DEFAULT 0,
  support_hourly_rate   numeric NOT NULL DEFAULT 0,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON indexation_history_sla
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE indexation_history_sla ENABLE ROW LEVEL SECURITY;

CREATE POLICY "indexation_history_sla_select" ON indexation_history_sla FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "indexation_history_sla_write" ON indexation_history_sla FOR ALL TO authenticated
  USING (get_user_role() IN ('admin', 'sales_manager'))
  WITH CHECK (get_user_role() IN ('admin', 'sales_manager'));

GRANT INSERT, UPDATE, DELETE ON public.indexation_history_sla TO authenticated;

-- ── indexation_history_sla_tools ─────────────────────────────────────────────
CREATE TABLE indexation_history_sla_tools (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  history_id      uuid NOT NULL REFERENCES indexation_history(id) ON DELETE CASCADE,
  tool_name       text NOT NULL,
  price           numeric NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON indexation_history_sla_tools
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_indexation_history_sla_tools_history ON indexation_history_sla_tools(history_id);

ALTER TABLE indexation_history_sla_tools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "indexation_history_sla_tools_select" ON indexation_history_sla_tools FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "indexation_history_sla_tools_write" ON indexation_history_sla_tools FOR ALL TO authenticated
  USING (get_user_role() IN ('admin', 'sales_manager'))
  WITH CHECK (get_user_role() IN ('admin', 'sales_manager'));

GRANT INSERT, UPDATE, DELETE ON public.indexation_history_sla_tools TO authenticated;
