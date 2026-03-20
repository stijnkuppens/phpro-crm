-- ============================================================================
-- Migration: ref_lead_sources + ref_distribution_types
-- Gap closure: these two reference tables were missing from 00054
-- ============================================================================

-- ── 1. ref_lead_sources (deal lead sources from demo_crm/src/App.tsx) ────────

CREATE TABLE IF NOT EXISTS ref_lead_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  sort_order integer DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ref_lead_sources_name_idx ON ref_lead_sources (name);

DROP TRIGGER IF EXISTS set_updated_at ON ref_lead_sources;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON ref_lead_sources
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE ref_lead_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ref_lead_sources_select" ON ref_lead_sources FOR SELECT TO authenticated USING (true);
CREATE POLICY "ref_lead_sources_insert" ON ref_lead_sources FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "ref_lead_sources_update" ON ref_lead_sources FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "ref_lead_sources_delete" ON ref_lead_sources FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

GRANT SELECT ON ref_lead_sources TO authenticated;
GRANT INSERT, UPDATE, DELETE ON ref_lead_sources TO authenticated;

DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE ref_lead_sources; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── 2. ref_distribution_types (VERDELING_OPTIES from demo_crm/src/constants.ts)

CREATE TABLE IF NOT EXISTS ref_distribution_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  sort_order integer DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ref_distribution_types_name_idx ON ref_distribution_types (name);

DROP TRIGGER IF EXISTS set_updated_at ON ref_distribution_types;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON ref_distribution_types
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE ref_distribution_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ref_distribution_types_select" ON ref_distribution_types FOR SELECT TO authenticated USING (true);
CREATE POLICY "ref_distribution_types_insert" ON ref_distribution_types FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "ref_distribution_types_update" ON ref_distribution_types FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "ref_distribution_types_delete" ON ref_distribution_types FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

GRANT SELECT ON ref_distribution_types TO authenticated;
GRANT INSERT, UPDATE, DELETE ON ref_distribution_types TO authenticated;

DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE ref_distribution_types; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
