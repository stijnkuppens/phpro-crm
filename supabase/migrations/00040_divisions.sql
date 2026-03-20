-- ============================================================================
-- Migration: Divisions and division services
-- ============================================================================

CREATE TABLE divisions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL UNIQUE,
  color           text,
  sort_order      int NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON divisions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE divisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "divisions_select" ON divisions FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "divisions_write" ON divisions FOR ALL TO authenticated
  USING (get_user_role() IN ('admin'))
  WITH CHECK (get_user_role() IN ('admin'));

CREATE TABLE division_services (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  division_id     uuid NOT NULL REFERENCES divisions(id) ON DELETE CASCADE,
  service_name    text NOT NULL,
  sort_order      int NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON division_services
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_division_services_division ON division_services(division_id);

ALTER TABLE division_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "division_services_select" ON division_services FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "division_services_write" ON division_services FOR ALL TO authenticated
  USING (get_user_role() IN ('admin'))
  WITH CHECK (get_user_role() IN ('admin'));

-- Seed divisions (production reference data)
INSERT INTO divisions (id, name, color, sort_order) VALUES
  ('d1000000-0000-0000-0000-000000000001', '25Carat', '#3b82f6', 1),
  ('d1000000-0000-0000-0000-000000000002', 'PHPro', '#10b981', 2)
ON CONFLICT (id) DO NOTHING;

INSERT INTO division_services (division_id, service_name, sort_order) VALUES
  ('d1000000-0000-0000-0000-000000000001', 'OroCommerce', 1),
  ('d1000000-0000-0000-0000-000000000001', 'Marello OMS', 2),
  ('d1000000-0000-0000-0000-000000000001', 'Marello B2B', 3),
  ('d1000000-0000-0000-0000-000000000002', 'Magento', 1),
  ('d1000000-0000-0000-0000-000000000002', 'Adobe Commerce', 2),
  ('d1000000-0000-0000-0000-000000000002', 'Sulu CMS', 3),
  ('d1000000-0000-0000-0000-000000000002', 'Custom Dev', 4),
  ('d1000000-0000-0000-0000-000000000002', 'Consultancy', 5)
ON CONFLICT DO NOTHING;

-- GRANT statements (required by project rules)
GRANT SELECT ON divisions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON divisions TO authenticated;
GRANT SELECT ON division_services TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON division_services TO authenticated;
