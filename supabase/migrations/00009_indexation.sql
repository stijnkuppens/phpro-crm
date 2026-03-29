/*
  Migration: Indexation Workflow

  Creates the indexation (annual price adjustment) tables:
  - indexation_config: per-account indexation settings
  - indexation_drafts: draft indexation proposals with status workflow
  - indexation_draft_rates: proposed rate changes per draft
  - indexation_draft_sla: proposed SLA amount changes per draft (1:1)
  - indexation_draft_sla_tools: proposed SLA tool price changes per draft
  - indexation_history: finalized indexation records
  - indexation_history_rates: historical rate snapshots
  - indexation_history_sla: historical SLA amount snapshots (1:1)
  - indexation_history_sla_tools: historical SLA tool price snapshots

  NOTE: indexation_indices is a reference table created in an earlier migration.
*/

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

-- Trigger
CREATE TRIGGER set_updated_at BEFORE UPDATE ON indexation_config
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

-- RLS
ALTER TABLE indexation_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "indexation_config_select" ON indexation_config
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "indexation_config_insert" ON indexation_config
  FOR INSERT TO authenticated
  WITH CHECK ((select public.get_user_role()) IN ('admin', 'sales_manager'));

CREATE POLICY "indexation_config_update" ON indexation_config
  FOR UPDATE TO authenticated
  USING ((select public.get_user_role()) IN ('admin', 'sales_manager'))
  WITH CHECK ((select public.get_user_role()) IN ('admin', 'sales_manager'));

CREATE POLICY "indexation_config_delete" ON indexation_config
  FOR DELETE TO authenticated
  USING ((select public.get_user_role()) IN ('admin', 'sales_manager'));

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON indexation_config TO authenticated;

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

-- Trigger
CREATE TRIGGER set_updated_at BEFORE UPDATE ON indexation_drafts
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

-- FK indexes
CREATE INDEX idx_indexation_drafts_account ON indexation_drafts(account_id);
CREATE INDEX idx_indexation_drafts_created_by ON indexation_drafts(created_by);
CREATE INDEX idx_indexation_drafts_approved_by ON indexation_drafts(approved_by);
CREATE INDEX idx_indexation_drafts_status ON indexation_drafts(status);

-- RLS
ALTER TABLE indexation_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "indexation_drafts_select" ON indexation_drafts
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "indexation_drafts_insert" ON indexation_drafts
  FOR INSERT TO authenticated
  WITH CHECK ((select public.get_user_role()) IN ('admin', 'sales_manager'));

CREATE POLICY "indexation_drafts_update" ON indexation_drafts
  FOR UPDATE TO authenticated
  USING ((select public.get_user_role()) IN ('admin', 'sales_manager'))
  WITH CHECK ((select public.get_user_role()) IN ('admin', 'sales_manager'));

CREATE POLICY "indexation_drafts_delete" ON indexation_drafts
  FOR DELETE TO authenticated
  USING ((select public.get_user_role()) IN ('admin', 'sales_manager'));

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON indexation_drafts TO authenticated;

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

-- Trigger
CREATE TRIGGER set_updated_at BEFORE UPDATE ON indexation_draft_rates
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

-- FK indexes
CREATE INDEX idx_indexation_draft_rates_draft ON indexation_draft_rates(draft_id);

-- RLS
ALTER TABLE indexation_draft_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "indexation_draft_rates_select" ON indexation_draft_rates
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "indexation_draft_rates_insert" ON indexation_draft_rates
  FOR INSERT TO authenticated
  WITH CHECK ((select public.get_user_role()) IN ('admin', 'sales_manager'));

CREATE POLICY "indexation_draft_rates_update" ON indexation_draft_rates
  FOR UPDATE TO authenticated
  USING ((select public.get_user_role()) IN ('admin', 'sales_manager'))
  WITH CHECK ((select public.get_user_role()) IN ('admin', 'sales_manager'));

CREATE POLICY "indexation_draft_rates_delete" ON indexation_draft_rates
  FOR DELETE TO authenticated
  USING ((select public.get_user_role()) IN ('admin', 'sales_manager'));

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON indexation_draft_rates TO authenticated;

-- ── indexation_draft_sla ─────────────────────────────────────────────────────

CREATE TABLE indexation_draft_sla (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  draft_id              uuid NOT NULL UNIQUE REFERENCES indexation_drafts(id) ON DELETE CASCADE,
  fixed_monthly_rate    numeric NOT NULL DEFAULT 0,
  support_hourly_rate   numeric NOT NULL DEFAULT 0,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

-- Trigger
CREATE TRIGGER set_updated_at BEFORE UPDATE ON indexation_draft_sla
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

-- RLS
ALTER TABLE indexation_draft_sla ENABLE ROW LEVEL SECURITY;

CREATE POLICY "indexation_draft_sla_select" ON indexation_draft_sla
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "indexation_draft_sla_insert" ON indexation_draft_sla
  FOR INSERT TO authenticated
  WITH CHECK ((select public.get_user_role()) IN ('admin', 'sales_manager'));

CREATE POLICY "indexation_draft_sla_update" ON indexation_draft_sla
  FOR UPDATE TO authenticated
  USING ((select public.get_user_role()) IN ('admin', 'sales_manager'))
  WITH CHECK ((select public.get_user_role()) IN ('admin', 'sales_manager'));

CREATE POLICY "indexation_draft_sla_delete" ON indexation_draft_sla
  FOR DELETE TO authenticated
  USING ((select public.get_user_role()) IN ('admin', 'sales_manager'));

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON indexation_draft_sla TO authenticated;

-- ── indexation_draft_sla_tools ───────────────────────────────────────────────

CREATE TABLE indexation_draft_sla_tools (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  draft_id        uuid NOT NULL REFERENCES indexation_drafts(id) ON DELETE CASCADE,
  tool_name       text NOT NULL,
  proposed_price  numeric NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Trigger
CREATE TRIGGER set_updated_at BEFORE UPDATE ON indexation_draft_sla_tools
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

-- FK indexes
CREATE INDEX idx_indexation_draft_sla_tools_draft ON indexation_draft_sla_tools(draft_id);

-- RLS
ALTER TABLE indexation_draft_sla_tools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "indexation_draft_sla_tools_select" ON indexation_draft_sla_tools
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "indexation_draft_sla_tools_insert" ON indexation_draft_sla_tools
  FOR INSERT TO authenticated
  WITH CHECK ((select public.get_user_role()) IN ('admin', 'sales_manager'));

CREATE POLICY "indexation_draft_sla_tools_update" ON indexation_draft_sla_tools
  FOR UPDATE TO authenticated
  USING ((select public.get_user_role()) IN ('admin', 'sales_manager'))
  WITH CHECK ((select public.get_user_role()) IN ('admin', 'sales_manager'));

CREATE POLICY "indexation_draft_sla_tools_delete" ON indexation_draft_sla_tools
  FOR DELETE TO authenticated
  USING ((select public.get_user_role()) IN ('admin', 'sales_manager'));

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON indexation_draft_sla_tools TO authenticated;

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

-- Trigger
CREATE TRIGGER set_updated_at BEFORE UPDATE ON indexation_history
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

-- FK indexes
CREATE INDEX idx_indexation_history_account ON indexation_history(account_id);

-- RLS
ALTER TABLE indexation_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "indexation_history_select" ON indexation_history
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "indexation_history_insert" ON indexation_history
  FOR INSERT TO authenticated
  WITH CHECK ((select public.get_user_role()) IN ('admin', 'sales_manager'));

CREATE POLICY "indexation_history_update" ON indexation_history
  FOR UPDATE TO authenticated
  USING ((select public.get_user_role()) IN ('admin', 'sales_manager'))
  WITH CHECK ((select public.get_user_role()) IN ('admin', 'sales_manager'));

CREATE POLICY "indexation_history_delete" ON indexation_history
  FOR DELETE TO authenticated
  USING ((select public.get_user_role()) IN ('admin', 'sales_manager'));

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON indexation_history TO authenticated;

-- ── indexation_history_rates ─────────────────────────────────────────────────

CREATE TABLE indexation_history_rates (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  history_id      uuid NOT NULL REFERENCES indexation_history(id) ON DELETE CASCADE,
  role            text NOT NULL,
  rate            numeric NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Trigger
CREATE TRIGGER set_updated_at BEFORE UPDATE ON indexation_history_rates
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

-- FK indexes
CREATE INDEX idx_indexation_history_rates_history ON indexation_history_rates(history_id);

-- RLS
ALTER TABLE indexation_history_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "indexation_history_rates_select" ON indexation_history_rates
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "indexation_history_rates_insert" ON indexation_history_rates
  FOR INSERT TO authenticated
  WITH CHECK ((select public.get_user_role()) IN ('admin', 'sales_manager'));

CREATE POLICY "indexation_history_rates_update" ON indexation_history_rates
  FOR UPDATE TO authenticated
  USING ((select public.get_user_role()) IN ('admin', 'sales_manager'))
  WITH CHECK ((select public.get_user_role()) IN ('admin', 'sales_manager'));

CREATE POLICY "indexation_history_rates_delete" ON indexation_history_rates
  FOR DELETE TO authenticated
  USING ((select public.get_user_role()) IN ('admin', 'sales_manager'));

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON indexation_history_rates TO authenticated;

-- ── indexation_history_sla ───────────────────────────────────────────────────

CREATE TABLE indexation_history_sla (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  history_id            uuid NOT NULL UNIQUE REFERENCES indexation_history(id) ON DELETE CASCADE,
  fixed_monthly_rate    numeric NOT NULL DEFAULT 0,
  support_hourly_rate   numeric NOT NULL DEFAULT 0,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

-- Trigger
CREATE TRIGGER set_updated_at BEFORE UPDATE ON indexation_history_sla
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

-- RLS
ALTER TABLE indexation_history_sla ENABLE ROW LEVEL SECURITY;

CREATE POLICY "indexation_history_sla_select" ON indexation_history_sla
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "indexation_history_sla_insert" ON indexation_history_sla
  FOR INSERT TO authenticated
  WITH CHECK ((select public.get_user_role()) IN ('admin', 'sales_manager'));

CREATE POLICY "indexation_history_sla_update" ON indexation_history_sla
  FOR UPDATE TO authenticated
  USING ((select public.get_user_role()) IN ('admin', 'sales_manager'))
  WITH CHECK ((select public.get_user_role()) IN ('admin', 'sales_manager'));

CREATE POLICY "indexation_history_sla_delete" ON indexation_history_sla
  FOR DELETE TO authenticated
  USING ((select public.get_user_role()) IN ('admin', 'sales_manager'));

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON indexation_history_sla TO authenticated;

-- ── indexation_history_sla_tools ─────────────────────────────────────────────

CREATE TABLE indexation_history_sla_tools (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  history_id      uuid NOT NULL REFERENCES indexation_history(id) ON DELETE CASCADE,
  tool_name       text NOT NULL,
  price           numeric NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Trigger
CREATE TRIGGER set_updated_at BEFORE UPDATE ON indexation_history_sla_tools
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

-- FK indexes
CREATE INDEX idx_indexation_history_sla_tools_history ON indexation_history_sla_tools(history_id);

-- RLS
ALTER TABLE indexation_history_sla_tools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "indexation_history_sla_tools_select" ON indexation_history_sla_tools
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "indexation_history_sla_tools_insert" ON indexation_history_sla_tools
  FOR INSERT TO authenticated
  WITH CHECK ((select public.get_user_role()) IN ('admin', 'sales_manager'));

CREATE POLICY "indexation_history_sla_tools_update" ON indexation_history_sla_tools
  FOR UPDATE TO authenticated
  USING ((select public.get_user_role()) IN ('admin', 'sales_manager'))
  WITH CHECK ((select public.get_user_role()) IN ('admin', 'sales_manager'));

CREATE POLICY "indexation_history_sla_tools_delete" ON indexation_history_sla_tools
  FOR DELETE TO authenticated
  USING ((select public.get_user_role()) IN ('admin', 'sales_manager'));

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON indexation_history_sla_tools TO authenticated;
