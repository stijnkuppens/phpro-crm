-- ============================================================================
-- Migration: ref_internal_people + ref_teams
-- Internal people (Managing Partner, Account Director, Project Manager)
-- and Teams (Team 1, etc.) as proper reference tables
-- ============================================================================

-- ── ref_internal_people ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ref_internal_people (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  sort_order integer DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ref_internal_people_name_idx ON ref_internal_people (name);

DROP TRIGGER IF EXISTS set_updated_at ON ref_internal_people;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON ref_internal_people
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE ref_internal_people ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ref_internal_people_select" ON ref_internal_people FOR SELECT TO authenticated USING (true);
CREATE POLICY "ref_internal_people_insert" ON ref_internal_people FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "ref_internal_people_update" ON ref_internal_people FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "ref_internal_people_delete" ON ref_internal_people FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

GRANT SELECT ON ref_internal_people TO authenticated;
GRANT INSERT, UPDATE, DELETE ON ref_internal_people TO authenticated;

DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE ref_internal_people; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── ref_teams ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ref_teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  sort_order integer DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ref_teams_name_idx ON ref_teams (name);

DROP TRIGGER IF EXISTS set_updated_at ON ref_teams;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON ref_teams
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE ref_teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ref_teams_select" ON ref_teams FOR SELECT TO authenticated USING (true);
CREATE POLICY "ref_teams_insert" ON ref_teams FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "ref_teams_update" ON ref_teams FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "ref_teams_delete" ON ref_teams FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

GRANT SELECT ON ref_teams TO authenticated;
GRANT INSERT, UPDATE, DELETE ON ref_teams TO authenticated;

DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE ref_teams; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
