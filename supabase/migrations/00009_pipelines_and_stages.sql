-- Pipelines table
CREATE TABLE pipelines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('projecten', 'rfp', 'consultancy')),
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Pipeline stages
CREATE TABLE pipeline_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id uuid NOT NULL REFERENCES pipelines(id) ON DELETE CASCADE,
  name text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  probability int NOT NULL DEFAULT 0 CHECK (probability >= 0 AND probability <= 100),
  color text NOT NULL DEFAULT '#6366f1',
  is_closed boolean NOT NULL DEFAULT false,
  is_won boolean NOT NULL DEFAULT false,
  is_longterm boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_pipeline_stages_pipeline_id ON pipeline_stages(pipeline_id);

-- Updated_at triggers
CREATE TRIGGER set_pipelines_updated_at
  BEFORE UPDATE ON pipelines
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_pipeline_stages_updated_at
  BEFORE UPDATE ON pipeline_stages
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS
ALTER TABLE pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_stages ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read pipelines and stages
CREATE POLICY "Authenticated users can read pipelines"
  ON pipelines FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can read pipeline stages"
  ON pipeline_stages FOR SELECT TO authenticated USING (true);

-- Only admins can modify pipelines
CREATE POLICY "Admins can insert pipelines"
  ON pipelines FOR INSERT TO authenticated
  WITH CHECK (get_user_role() = 'admin');

CREATE POLICY "Admins can update pipelines"
  ON pipelines FOR UPDATE TO authenticated
  USING (get_user_role() = 'admin');

CREATE POLICY "Admins can delete pipelines"
  ON pipelines FOR DELETE TO authenticated
  USING (get_user_role() = 'admin');

-- Only admins can modify stages
CREATE POLICY "Admins can insert pipeline stages"
  ON pipeline_stages FOR INSERT TO authenticated
  WITH CHECK (get_user_role() = 'admin');

CREATE POLICY "Admins can update pipeline stages"
  ON pipeline_stages FOR UPDATE TO authenticated
  USING (get_user_role() = 'admin');

CREATE POLICY "Admins can delete pipeline stages"
  ON pipeline_stages FOR DELETE TO authenticated
  USING (get_user_role() = 'admin');

-- Seed the 3 pipelines with stages
INSERT INTO pipelines (id, name, type, sort_order) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Projecten', 'projecten', 1),
  ('00000000-0000-0000-0000-000000000002', 'RFP', 'rfp', 2),
  ('00000000-0000-0000-0000-000000000003', 'Consultancy Profielen', 'consultancy', 3)
ON CONFLICT (id) DO NOTHING;

-- Projecten stages
INSERT INTO pipeline_stages (pipeline_id, name, sort_order, probability, color, is_closed, is_won, is_longterm) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Lead',           1,  10, '#6366f1', false, false, false),
  ('00000000-0000-0000-0000-000000000001', 'Meeting',        2,  25, '#8b5cf6', false, false, false),
  ('00000000-0000-0000-0000-000000000001', 'Demo',           3,  40, '#a855f7', false, false, false),
  ('00000000-0000-0000-0000-000000000001', 'Voorstel',       4,  60, '#d946ef', false, false, false),
  ('00000000-0000-0000-0000-000000000001', 'Onderhandeling', 5,  80, '#ec4899', false, false, false),
  ('00000000-0000-0000-0000-000000000001', 'Gewonnen',       6, 100, '#22c55e', true,  true,  false),
  ('00000000-0000-0000-0000-000000000001', 'Verloren',       7,   0, '#ef4444', true,  false, false),
  ('00000000-0000-0000-0000-000000000001', 'Longterm',       8,   0, '#f59e0b', true,  false, true)
ON CONFLICT (id) DO NOTHING;

-- RFP stages
INSERT INTO pipeline_stages (pipeline_id, name, sort_order, probability, color, is_closed, is_won, is_longterm) VALUES
  ('00000000-0000-0000-0000-000000000002', 'Ontvangen',        1,  10, '#06b6d4', false, false, false),
  ('00000000-0000-0000-0000-000000000002', 'Kandidaatstelling', 2, 25, '#0891b2', false, false, false),
  ('00000000-0000-0000-0000-000000000002', 'RFI',              3,  40, '#0e7490', false, false, false),
  ('00000000-0000-0000-0000-000000000002', 'RFP',              4,  60, '#0c4a6e', false, false, false),
  ('00000000-0000-0000-0000-000000000002', 'Onderhandeling',   5,  80, '#1e3a5f', false, false, false),
  ('00000000-0000-0000-0000-000000000002', 'Gewonnen',         6, 100, '#22c55e', true,  true,  false),
  ('00000000-0000-0000-0000-000000000002', 'Verloren',         7,   0, '#ef4444', true,  false, false),
  ('00000000-0000-0000-0000-000000000002', 'Longterm',         8,   0, '#f59e0b', true,  false, true)
ON CONFLICT (id) DO NOTHING;

-- Consultancy Profielen stages
INSERT INTO pipeline_stages (pipeline_id, name, sort_order, probability, color, is_closed, is_won, is_longterm) VALUES
  ('00000000-0000-0000-0000-000000000003', 'Lead',             1,  10, '#14b8a6', false, false, false),
  ('00000000-0000-0000-0000-000000000003', 'CV/Info',          2,  25, '#0d9488', false, false, false),
  ('00000000-0000-0000-0000-000000000003', 'Intake',           3,  50, '#0f766e', false, false, false),
  ('00000000-0000-0000-0000-000000000003', 'Contract',         4,  75, '#115e59', false, false, false),
  ('00000000-0000-0000-0000-000000000003', 'Geplaatst',        5, 100, '#22c55e', true,  true,  false),
  ('00000000-0000-0000-0000-000000000003', 'Niet weerhouden',  6,   0, '#ef4444', true,  false, false)
ON CONFLICT (id) DO NOTHING;
