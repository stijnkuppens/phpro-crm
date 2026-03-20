-- ============================================================================
-- Migration: Revenue entries, account revenue, pipeline entries
-- ============================================================================

-- ── revenue_entries ─────────────────────────────────────────────────────────
CREATE TABLE revenue_entries (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  revenue_client_id   uuid NOT NULL REFERENCES revenue_clients(id) ON DELETE CASCADE,
  division_id         uuid NOT NULL REFERENCES divisions(id) ON DELETE CASCADE,
  service_name        text NOT NULL,
  year                int NOT NULL,
  month               int NOT NULL CHECK (month >= 0 AND month <= 11),
  amount              numeric NOT NULL DEFAULT 0,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (revenue_client_id, division_id, service_name, year, month)
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON revenue_entries
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_revenue_entries_client ON revenue_entries(revenue_client_id);
CREATE INDEX idx_revenue_entries_division ON revenue_entries(division_id);
CREATE INDEX idx_revenue_entries_year ON revenue_entries(year);
CREATE INDEX idx_revenue_entries_year_month ON revenue_entries(year, month);

ALTER TABLE revenue_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "revenue_entries_select" ON revenue_entries FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "revenue_entries_insert" ON revenue_entries FOR INSERT TO authenticated
  WITH CHECK (get_user_role() IN ('admin', 'sales_manager'));
CREATE POLICY "revenue_entries_update" ON revenue_entries FOR UPDATE TO authenticated
  USING (get_user_role() IN ('admin', 'sales_manager'))
  WITH CHECK (get_user_role() IN ('admin', 'sales_manager'));
CREATE POLICY "revenue_entries_delete" ON revenue_entries FOR DELETE TO authenticated
  USING (get_user_role() IN ('admin', 'sales_manager'));

-- ── account_revenue ─────────────────────────────────────────────────────────
CREATE TABLE account_revenue (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id      uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  year            int NOT NULL,
  category        text NOT NULL,
  amount          numeric NOT NULL DEFAULT 0,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON account_revenue
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_account_revenue_account ON account_revenue(account_id);
CREATE INDEX idx_account_revenue_year ON account_revenue(account_id, year);

ALTER TABLE account_revenue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "account_revenue_select" ON account_revenue FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "account_revenue_insert" ON account_revenue FOR INSERT TO authenticated
  WITH CHECK (get_user_role() IN ('admin', 'sales_manager', 'sales_rep'));
CREATE POLICY "account_revenue_update" ON account_revenue FOR UPDATE TO authenticated
  USING (get_user_role() IN ('admin', 'sales_manager', 'sales_rep'))
  WITH CHECK (get_user_role() IN ('admin', 'sales_manager', 'sales_rep'));
CREATE POLICY "account_revenue_delete" ON account_revenue FOR DELETE TO authenticated
  USING (get_user_role() IN ('admin', 'sales_manager'));

-- ── pipeline_entries ────────────────────────────────────────────────────────
CREATE TABLE pipeline_entries (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id         uuid REFERENCES deals(id) ON DELETE SET NULL,
  client          text NOT NULL,
  division_id     uuid NOT NULL REFERENCES divisions(id) ON DELETE CASCADE,
  service_name    text NOT NULL,
  sold_month      int NOT NULL CHECK (sold_month >= 0 AND sold_month <= 11),
  start_month     int NOT NULL CHECK (start_month >= 0 AND start_month <= 11),
  duration        int NOT NULL DEFAULT 1 CHECK (duration >= 1),
  total           numeric NOT NULL DEFAULT 0,
  year            int NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON pipeline_entries
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_pipeline_entries_division ON pipeline_entries(division_id);
CREATE INDEX idx_pipeline_entries_year ON pipeline_entries(year);

ALTER TABLE pipeline_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pipeline_entries_select" ON pipeline_entries FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "pipeline_entries_insert" ON pipeline_entries FOR INSERT TO authenticated
  WITH CHECK (get_user_role() IN ('admin', 'sales_manager'));
CREATE POLICY "pipeline_entries_update" ON pipeline_entries FOR UPDATE TO authenticated
  USING (get_user_role() IN ('admin', 'sales_manager'))
  WITH CHECK (get_user_role() IN ('admin', 'sales_manager'));
CREATE POLICY "pipeline_entries_delete" ON pipeline_entries FOR DELETE TO authenticated
  USING (get_user_role() IN ('admin', 'sales_manager'));

-- GRANT statements
GRANT SELECT, INSERT, UPDATE, DELETE ON revenue_entries TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON account_revenue TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON pipeline_entries TO authenticated;
