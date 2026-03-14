-- ============================================================================
-- Migration: Contracts and Rates
-- ============================================================================

-- ── contracts ────────────────────────────────────────────────────────────────
CREATE TABLE contracts (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id              uuid NOT NULL UNIQUE REFERENCES accounts(id) ON DELETE CASCADE,
  has_framework_contract  bool NOT NULL DEFAULT false,
  framework_pdf_url       text,
  framework_start         date,
  framework_end           date,
  framework_indefinite    bool NOT NULL DEFAULT false,
  has_service_contract    bool NOT NULL DEFAULT false,
  service_pdf_url         text,
  service_start           date,
  service_end             date,
  service_indefinite      bool NOT NULL DEFAULT false,
  purchase_orders_url     text,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER set_updated_at BEFORE UPDATE ON contracts FOR EACH ROW EXECUTE FUNCTION set_updated_at();
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "contracts_select" ON contracts FOR SELECT TO authenticated USING (true);
CREATE POLICY "contracts_insert" ON contracts FOR INSERT TO authenticated WITH CHECK (get_user_role() IN ('admin', 'sales_manager'));
CREATE POLICY "contracts_update" ON contracts FOR UPDATE TO authenticated USING (get_user_role() IN ('admin', 'sales_manager')) WITH CHECK (get_user_role() IN ('admin', 'sales_manager'));
CREATE POLICY "contracts_delete" ON contracts FOR DELETE TO authenticated USING (get_user_role() IN ('admin'));

GRANT INSERT, UPDATE, DELETE ON public.contracts TO authenticated;

-- ── hourly_rates ─────────────────────────────────────────────────────────────
CREATE TABLE hourly_rates (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id      uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  year            int NOT NULL,
  role            text NOT NULL,
  rate            numeric NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (account_id, year, role)
);
CREATE TRIGGER set_updated_at BEFORE UPDATE ON hourly_rates FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE INDEX idx_hourly_rates_account_year ON hourly_rates(account_id, year);
ALTER TABLE hourly_rates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hourly_rates_select" ON hourly_rates FOR SELECT TO authenticated USING (true);
CREATE POLICY "hourly_rates_insert" ON hourly_rates FOR INSERT TO authenticated WITH CHECK (get_user_role() IN ('admin', 'sales_manager'));
CREATE POLICY "hourly_rates_update" ON hourly_rates FOR UPDATE TO authenticated USING (get_user_role() IN ('admin', 'sales_manager')) WITH CHECK (get_user_role() IN ('admin', 'sales_manager'));
CREATE POLICY "hourly_rates_delete" ON hourly_rates FOR DELETE TO authenticated USING (get_user_role() IN ('admin'));

GRANT INSERT, UPDATE, DELETE ON public.hourly_rates TO authenticated;

-- ── sla_rates ────────────────────────────────────────────────────────────────
CREATE TABLE sla_rates (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id            uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  year                  int NOT NULL,
  fixed_monthly_rate    numeric NOT NULL DEFAULT 0,
  support_hourly_rate   numeric NOT NULL DEFAULT 0,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  UNIQUE (account_id, year)
);
CREATE TRIGGER set_updated_at BEFORE UPDATE ON sla_rates FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE INDEX idx_sla_rates_account_year ON sla_rates(account_id, year);
ALTER TABLE sla_rates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sla_rates_select" ON sla_rates FOR SELECT TO authenticated USING (true);
CREATE POLICY "sla_rates_insert" ON sla_rates FOR INSERT TO authenticated WITH CHECK (get_user_role() IN ('admin', 'sales_manager'));
CREATE POLICY "sla_rates_update" ON sla_rates FOR UPDATE TO authenticated USING (get_user_role() IN ('admin', 'sales_manager')) WITH CHECK (get_user_role() IN ('admin', 'sales_manager'));
CREATE POLICY "sla_rates_delete" ON sla_rates FOR DELETE TO authenticated USING (get_user_role() IN ('admin'));

GRANT INSERT, UPDATE, DELETE ON public.sla_rates TO authenticated;

-- ── sla_tools ─────────────────────────────────────────────────────────────────
CREATE TABLE sla_tools (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sla_rate_id     uuid NOT NULL REFERENCES sla_rates(id) ON DELETE CASCADE,
  tool_name       text NOT NULL,
  monthly_price   numeric NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER set_updated_at BEFORE UPDATE ON sla_tools FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE INDEX idx_sla_tools_sla_rate ON sla_tools(sla_rate_id);
ALTER TABLE sla_tools ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sla_tools_select" ON sla_tools FOR SELECT TO authenticated USING (true);
CREATE POLICY "sla_tools_write" ON sla_tools FOR ALL TO authenticated USING (get_user_role() IN ('admin', 'sales_manager')) WITH CHECK (get_user_role() IN ('admin', 'sales_manager'));

GRANT INSERT, UPDATE, DELETE ON public.sla_tools TO authenticated;
