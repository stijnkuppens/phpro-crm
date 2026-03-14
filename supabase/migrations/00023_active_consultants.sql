-- ============================================================================
-- Migration: Active Consultants
-- ============================================================================

-- ── active_consultants ───────────────────────────────────────────────────────
CREATE TABLE active_consultants (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id          uuid REFERENCES accounts(id) ON DELETE SET NULL,
  first_name          text NOT NULL,
  last_name           text NOT NULL,
  role                text,
  city                text,
  cv_pdf_url          text,
  is_active           bool NOT NULL DEFAULT true,
  client_name         text,
  client_city         text,
  start_date          date NOT NULL,
  end_date            date,
  is_indefinite       bool NOT NULL DEFAULT false,
  hourly_rate         numeric NOT NULL,
  sow_url             text,
  notice_period_days  int DEFAULT 30,
  notes               text,
  is_stopped          bool NOT NULL DEFAULT false,
  stop_date           date,
  stop_reason         text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON active_consultants FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE INDEX idx_active_consultants_account ON active_consultants(account_id);
CREATE INDEX idx_active_consultants_active ON active_consultants(is_active);

ALTER TABLE active_consultants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "active_consultants_select" ON active_consultants FOR SELECT TO authenticated USING (true);
CREATE POLICY "active_consultants_insert" ON active_consultants FOR INSERT TO authenticated WITH CHECK (get_user_role() IN ('admin', 'sales_manager'));
CREATE POLICY "active_consultants_update" ON active_consultants FOR UPDATE TO authenticated USING (get_user_role() IN ('admin', 'sales_manager')) WITH CHECK (get_user_role() IN ('admin', 'sales_manager'));
CREATE POLICY "active_consultants_delete" ON active_consultants FOR DELETE TO authenticated USING (get_user_role() IN ('admin'));

GRANT INSERT, UPDATE, DELETE ON public.active_consultants TO authenticated;

ALTER PUBLICATION supabase_realtime ADD TABLE active_consultants;

-- ── consultant_rate_history ──────────────────────────────────────────────────
CREATE TABLE consultant_rate_history (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  active_consultant_id  uuid NOT NULL REFERENCES active_consultants(id) ON DELETE CASCADE,
  date                  date NOT NULL,
  rate                  numeric NOT NULL,
  reason                text,
  notes                 text,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER set_updated_at BEFORE UPDATE ON consultant_rate_history FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE INDEX idx_consultant_rate_history_consultant ON consultant_rate_history(active_consultant_id);
ALTER TABLE consultant_rate_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "consultant_rate_history_select" ON consultant_rate_history FOR SELECT TO authenticated USING (true);
CREATE POLICY "consultant_rate_history_write" ON consultant_rate_history FOR ALL TO authenticated USING (get_user_role() IN ('admin', 'sales_manager')) WITH CHECK (get_user_role() IN ('admin', 'sales_manager'));

GRANT INSERT, UPDATE, DELETE ON public.consultant_rate_history TO authenticated;

-- ── consultant_extensions ────────────────────────────────────────────────────
CREATE TABLE consultant_extensions (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  active_consultant_id  uuid NOT NULL REFERENCES active_consultants(id) ON DELETE CASCADE,
  new_end_date          date NOT NULL,
  notes                 text,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER set_updated_at BEFORE UPDATE ON consultant_extensions FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE INDEX idx_consultant_extensions_consultant ON consultant_extensions(active_consultant_id);
ALTER TABLE consultant_extensions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "consultant_extensions_select" ON consultant_extensions FOR SELECT TO authenticated USING (true);
CREATE POLICY "consultant_extensions_write" ON consultant_extensions FOR ALL TO authenticated USING (get_user_role() IN ('admin', 'sales_manager')) WITH CHECK (get_user_role() IN ('admin', 'sales_manager'));

GRANT INSERT, UPDATE, DELETE ON public.consultant_extensions TO authenticated;

-- ── consultant_contract_attributions ────────────────────────────────────────
CREATE TABLE consultant_contract_attributions (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  active_consultant_id  uuid NOT NULL REFERENCES active_consultants(id) ON DELETE CASCADE,
  type                  text NOT NULL CHECK (type IN ('rechtstreeks', 'cronos')),
  contact_id            uuid REFERENCES contacts(id) ON DELETE SET NULL,
  cc_name               text,
  cc_contact_person     text,
  cc_email              text,
  cc_phone              text,
  cc_distribution       text,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER set_updated_at BEFORE UPDATE ON consultant_contract_attributions FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE UNIQUE INDEX idx_consultant_contract_attributions_consultant ON consultant_contract_attributions(active_consultant_id);
ALTER TABLE consultant_contract_attributions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "consultant_contract_attributions_select" ON consultant_contract_attributions FOR SELECT TO authenticated USING (true);
CREATE POLICY "consultant_contract_attributions_write" ON consultant_contract_attributions FOR ALL TO authenticated USING (get_user_role() IN ('admin', 'sales_manager')) WITH CHECK (get_user_role() IN ('admin', 'sales_manager'));

GRANT INSERT, UPDATE, DELETE ON public.consultant_contract_attributions TO authenticated;
