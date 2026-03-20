-- ============================================================================
-- Migration: Reference lookup tables (13 tables)
-- All reference data sets from demo_crm/src/constants.ts as proper DB tables
-- ============================================================================

-- ── Helper: repeatable pattern per table ──────────────────────────────────
-- Each table: id, name (unique), sort_order, is_active, timestamps
-- RLS: select for all authenticated, insert/update/delete for admin only
-- Trigger: set_updated_at
-- Realtime: added to publication

-- ── 1. ref_competence_centers (CC_NAMEN) ──────────────────────────────────

CREATE TABLE IF NOT EXISTS ref_competence_centers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  sort_order integer DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ref_competence_centers_name_idx ON ref_competence_centers (name);

DROP TRIGGER IF EXISTS set_updated_at ON ref_competence_centers;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON ref_competence_centers
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE ref_competence_centers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ref_competence_centers_select" ON ref_competence_centers FOR SELECT TO authenticated USING (true);
CREATE POLICY "ref_competence_centers_insert" ON ref_competence_centers FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "ref_competence_centers_update" ON ref_competence_centers FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "ref_competence_centers_delete" ON ref_competence_centers FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

GRANT SELECT ON ref_competence_centers TO authenticated;
GRANT INSERT, UPDATE, DELETE ON ref_competence_centers TO authenticated;

DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE ref_competence_centers; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── 2. ref_cc_services (CC_SERVICES) ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS ref_cc_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  sort_order integer DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ref_cc_services_name_idx ON ref_cc_services (name);

DROP TRIGGER IF EXISTS set_updated_at ON ref_cc_services;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON ref_cc_services
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE ref_cc_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ref_cc_services_select" ON ref_cc_services FOR SELECT TO authenticated USING (true);
CREATE POLICY "ref_cc_services_insert" ON ref_cc_services FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "ref_cc_services_update" ON ref_cc_services FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "ref_cc_services_delete" ON ref_cc_services FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

GRANT SELECT ON ref_cc_services TO authenticated;
GRANT INSERT, UPDATE, DELETE ON ref_cc_services TO authenticated;

DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE ref_cc_services; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── 3. ref_consultant_roles (merged CONSULTANT_ROLES + TARIEF_ROLLEN) ─────

CREATE TABLE IF NOT EXISTS ref_consultant_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  sort_order integer DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ref_consultant_roles_name_idx ON ref_consultant_roles (name);

DROP TRIGGER IF EXISTS set_updated_at ON ref_consultant_roles;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON ref_consultant_roles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE ref_consultant_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ref_consultant_roles_select" ON ref_consultant_roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "ref_consultant_roles_insert" ON ref_consultant_roles FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "ref_consultant_roles_update" ON ref_consultant_roles FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "ref_consultant_roles_delete" ON ref_consultant_roles FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

GRANT SELECT ON ref_consultant_roles TO authenticated;
GRANT INSERT, UPDATE, DELETE ON ref_consultant_roles TO authenticated;

DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE ref_consultant_roles; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── 4. ref_technologies (TECH_SUGGESTIONS) ────────────────────────────────

CREATE TABLE IF NOT EXISTS ref_technologies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  sort_order integer DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ref_technologies_name_idx ON ref_technologies (name);

DROP TRIGGER IF EXISTS set_updated_at ON ref_technologies;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON ref_technologies
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE ref_technologies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ref_technologies_select" ON ref_technologies FOR SELECT TO authenticated USING (true);
CREATE POLICY "ref_technologies_insert" ON ref_technologies FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "ref_technologies_update" ON ref_technologies FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "ref_technologies_delete" ON ref_technologies FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

GRANT SELECT ON ref_technologies TO authenticated;
GRANT INSERT, UPDATE, DELETE ON ref_technologies TO authenticated;

DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE ref_technologies; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── 5. ref_hosting_providers (HOSTING_PROVIDERS) ──────────────────────────

CREATE TABLE IF NOT EXISTS ref_hosting_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  sort_order integer DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ref_hosting_providers_name_idx ON ref_hosting_providers (name);

DROP TRIGGER IF EXISTS set_updated_at ON ref_hosting_providers;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON ref_hosting_providers
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE ref_hosting_providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ref_hosting_providers_select" ON ref_hosting_providers FOR SELECT TO authenticated USING (true);
CREATE POLICY "ref_hosting_providers_insert" ON ref_hosting_providers FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "ref_hosting_providers_update" ON ref_hosting_providers FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "ref_hosting_providers_delete" ON ref_hosting_providers FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

GRANT SELECT ON ref_hosting_providers TO authenticated;
GRANT INSERT, UPDATE, DELETE ON ref_hosting_providers TO authenticated;

DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE ref_hosting_providers; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── 6. ref_hosting_environments (HOSTING_OMGEVINGEN) ──────────────────────

CREATE TABLE IF NOT EXISTS ref_hosting_environments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  sort_order integer DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ref_hosting_environments_name_idx ON ref_hosting_environments (name);

DROP TRIGGER IF EXISTS set_updated_at ON ref_hosting_environments;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON ref_hosting_environments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE ref_hosting_environments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ref_hosting_environments_select" ON ref_hosting_environments FOR SELECT TO authenticated USING (true);
CREATE POLICY "ref_hosting_environments_insert" ON ref_hosting_environments FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "ref_hosting_environments_update" ON ref_hosting_environments FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "ref_hosting_environments_delete" ON ref_hosting_environments FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

GRANT SELECT ON ref_hosting_environments TO authenticated;
GRANT INSERT, UPDATE, DELETE ON ref_hosting_environments TO authenticated;

DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE ref_hosting_environments; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── 7. ref_languages (TALEN_LIJST) ───────────────────────────────────────

CREATE TABLE IF NOT EXISTS ref_languages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  sort_order integer DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ref_languages_name_idx ON ref_languages (name);

DROP TRIGGER IF EXISTS set_updated_at ON ref_languages;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON ref_languages
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE ref_languages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ref_languages_select" ON ref_languages FOR SELECT TO authenticated USING (true);
CREATE POLICY "ref_languages_insert" ON ref_languages FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "ref_languages_update" ON ref_languages FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "ref_languages_delete" ON ref_languages FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

GRANT SELECT ON ref_languages TO authenticated;
GRANT INSERT, UPDATE, DELETE ON ref_languages TO authenticated;

DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE ref_languages; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── 8. ref_language_levels (TAAL_NIVEAUS) ─────────────────────────────────

CREATE TABLE IF NOT EXISTS ref_language_levels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  sort_order integer DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ref_language_levels_name_idx ON ref_language_levels (name);

DROP TRIGGER IF EXISTS set_updated_at ON ref_language_levels;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON ref_language_levels
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE ref_language_levels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ref_language_levels_select" ON ref_language_levels FOR SELECT TO authenticated USING (true);
CREATE POLICY "ref_language_levels_insert" ON ref_language_levels FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "ref_language_levels_update" ON ref_language_levels FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "ref_language_levels_delete" ON ref_language_levels FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

GRANT SELECT ON ref_language_levels TO authenticated;
GRANT INSERT, UPDATE, DELETE ON ref_language_levels TO authenticated;

DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE ref_language_levels; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── 9. ref_contact_roles (CONTACT_ROLES) ──────────────────────────────────

CREATE TABLE IF NOT EXISTS ref_contact_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  sort_order integer DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ref_contact_roles_name_idx ON ref_contact_roles (name);

DROP TRIGGER IF EXISTS set_updated_at ON ref_contact_roles;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON ref_contact_roles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE ref_contact_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ref_contact_roles_select" ON ref_contact_roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "ref_contact_roles_insert" ON ref_contact_roles FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "ref_contact_roles_update" ON ref_contact_roles FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "ref_contact_roles_delete" ON ref_contact_roles FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

GRANT SELECT ON ref_contact_roles TO authenticated;
GRANT INSERT, UPDATE, DELETE ON ref_contact_roles TO authenticated;

DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE ref_contact_roles; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── 10. ref_hobbies (HOBBY_SUGGESTIONS) ───────────────────────────────────

CREATE TABLE IF NOT EXISTS ref_hobbies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  sort_order integer DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ref_hobbies_name_idx ON ref_hobbies (name);

DROP TRIGGER IF EXISTS set_updated_at ON ref_hobbies;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON ref_hobbies
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE ref_hobbies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ref_hobbies_select" ON ref_hobbies FOR SELECT TO authenticated USING (true);
CREATE POLICY "ref_hobbies_insert" ON ref_hobbies FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "ref_hobbies_update" ON ref_hobbies FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "ref_hobbies_delete" ON ref_hobbies FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

GRANT SELECT ON ref_hobbies TO authenticated;
GRANT INSERT, UPDATE, DELETE ON ref_hobbies TO authenticated;

DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE ref_hobbies; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── 11. ref_sla_tools (SLA_TOOL_SUGGESTIONS) ─────────────────────────────

CREATE TABLE IF NOT EXISTS ref_sla_tools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  sort_order integer DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ref_sla_tools_name_idx ON ref_sla_tools (name);

DROP TRIGGER IF EXISTS set_updated_at ON ref_sla_tools;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON ref_sla_tools
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE ref_sla_tools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ref_sla_tools_select" ON ref_sla_tools FOR SELECT TO authenticated USING (true);
CREATE POLICY "ref_sla_tools_insert" ON ref_sla_tools FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "ref_sla_tools_update" ON ref_sla_tools FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "ref_sla_tools_delete" ON ref_sla_tools FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

GRANT SELECT ON ref_sla_tools TO authenticated;
GRANT INSERT, UPDATE, DELETE ON ref_sla_tools TO authenticated;

DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE ref_sla_tools; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── 12. ref_collaboration_types (SAMENWERKINGSVORMEN) ─────────────────────

CREATE TABLE IF NOT EXISTS ref_collaboration_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  sort_order integer DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ref_collaboration_types_name_idx ON ref_collaboration_types (name);

DROP TRIGGER IF EXISTS set_updated_at ON ref_collaboration_types;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON ref_collaboration_types
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE ref_collaboration_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ref_collaboration_types_select" ON ref_collaboration_types FOR SELECT TO authenticated USING (true);
CREATE POLICY "ref_collaboration_types_insert" ON ref_collaboration_types FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "ref_collaboration_types_update" ON ref_collaboration_types FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "ref_collaboration_types_delete" ON ref_collaboration_types FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

GRANT SELECT ON ref_collaboration_types TO authenticated;
GRANT INSERT, UPDATE, DELETE ON ref_collaboration_types TO authenticated;

DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE ref_collaboration_types; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── 13. ref_stop_reasons (STOPZET_REDENEN) ────────────────────────────────

CREATE TABLE IF NOT EXISTS ref_stop_reasons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  sort_order integer DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ref_stop_reasons_name_idx ON ref_stop_reasons (name);

DROP TRIGGER IF EXISTS set_updated_at ON ref_stop_reasons;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON ref_stop_reasons
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE ref_stop_reasons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ref_stop_reasons_select" ON ref_stop_reasons FOR SELECT TO authenticated USING (true);
CREATE POLICY "ref_stop_reasons_insert" ON ref_stop_reasons FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "ref_stop_reasons_update" ON ref_stop_reasons FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "ref_stop_reasons_delete" ON ref_stop_reasons FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

GRANT SELECT ON ref_stop_reasons TO authenticated;
GRANT INSERT, UPDATE, DELETE ON ref_stop_reasons TO authenticated;

DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE ref_stop_reasons; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
