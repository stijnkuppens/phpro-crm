-- ============================================================================
-- Migration: Revenue clients with division and service mappings
-- ============================================================================

CREATE TABLE revenue_clients (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  account_id      uuid REFERENCES accounts(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON revenue_clients
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_revenue_clients_account ON revenue_clients(account_id);

ALTER TABLE revenue_clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "revenue_clients_select" ON revenue_clients FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "revenue_clients_insert" ON revenue_clients FOR INSERT TO authenticated
  WITH CHECK (get_user_role() IN ('admin', 'sales_manager'));
CREATE POLICY "revenue_clients_update" ON revenue_clients FOR UPDATE TO authenticated
  USING (get_user_role() IN ('admin', 'sales_manager'))
  WITH CHECK (get_user_role() IN ('admin', 'sales_manager'));
CREATE POLICY "revenue_clients_delete" ON revenue_clients FOR DELETE TO authenticated
  USING (get_user_role() IN ('admin'));

CREATE TABLE revenue_client_divisions (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  revenue_client_id   uuid NOT NULL REFERENCES revenue_clients(id) ON DELETE CASCADE,
  division_id         uuid NOT NULL REFERENCES divisions(id) ON DELETE CASCADE,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON revenue_client_divisions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_revenue_client_divisions_client ON revenue_client_divisions(revenue_client_id);
CREATE INDEX idx_revenue_client_divisions_division ON revenue_client_divisions(division_id);

ALTER TABLE revenue_client_divisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "revenue_client_divisions_select" ON revenue_client_divisions FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "revenue_client_divisions_write" ON revenue_client_divisions FOR ALL TO authenticated
  USING (get_user_role() IN ('admin', 'sales_manager'))
  WITH CHECK (get_user_role() IN ('admin', 'sales_manager'));

CREATE TABLE revenue_client_services (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  revenue_client_id   uuid NOT NULL REFERENCES revenue_clients(id) ON DELETE CASCADE,
  division_id         uuid NOT NULL REFERENCES divisions(id) ON DELETE CASCADE,
  service_name        text NOT NULL,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON revenue_client_services
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_revenue_client_services_client ON revenue_client_services(revenue_client_id);

ALTER TABLE revenue_client_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "revenue_client_services_select" ON revenue_client_services FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "revenue_client_services_write" ON revenue_client_services FOR ALL TO authenticated
  USING (get_user_role() IN ('admin', 'sales_manager'))
  WITH CHECK (get_user_role() IN ('admin', 'sales_manager'));

-- GRANT statements
GRANT SELECT, INSERT, UPDATE, DELETE ON revenue_clients TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON revenue_client_divisions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON revenue_client_services TO authenticated;
