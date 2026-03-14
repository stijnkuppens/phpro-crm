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

-- Production data (pipelines, stages) moved to supabase/data/002_pipelines.sql
