/*
  Migration: 00003_reference_tables

  Creates all reference/lookup tables for the CRM:
  - Pipeline tables (pipelines, pipeline_stages)
  - Indexation reference (indexation_indices)
  - 17 ref_* lookup tables with identical structure

  All ref_* tables: id, name, sort_order, active, timestamps.
  Exception: ref_internal_people adds email and avatar_url columns.

  RLS: all authenticated can SELECT; admin and sales_manager can INSERT/UPDATE/DELETE.
  Each table gets a moddatetime trigger, GRANT statements, and realtime publication.
*/

-- ============================================================================
-- Group 1: Pipeline tables
-- ============================================================================

-- ── 1. pipelines ────────────────────────────────────────────────────────────

CREATE TABLE pipelines (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text        NOT NULL,
  type        text        NOT NULL CHECK (type IN ('projecten', 'rfp', 'consultancy')),
  sort_order  integer     NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_pipelines_updated_at
  BEFORE UPDATE ON pipelines
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

ALTER TABLE pipelines ENABLE ROW LEVEL SECURITY;

CREATE POLICY pipelines_select ON pipelines
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY pipelines_insert ON pipelines
  FOR INSERT TO authenticated
  WITH CHECK ((select public.get_user_role()) IN ('admin', 'sales_manager'));

CREATE POLICY pipelines_update ON pipelines
  FOR UPDATE TO authenticated
  USING ((select public.get_user_role()) IN ('admin', 'sales_manager'))
  WITH CHECK ((select public.get_user_role()) IN ('admin', 'sales_manager'));

CREATE POLICY pipelines_delete ON pipelines
  FOR DELETE TO authenticated
  USING ((select public.get_user_role()) IN ('admin', 'sales_manager'));

GRANT SELECT ON pipelines TO authenticated;
GRANT ALL ON pipelines TO service_role;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE pipelines;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── 2. pipeline_stages ──────────────────────────────────────────────────────

CREATE TABLE pipeline_stages (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id uuid        NOT NULL REFERENCES pipelines(id) ON DELETE CASCADE,
  name        text        NOT NULL,
  sort_order  integer     NOT NULL DEFAULT 0,
  probability integer     NOT NULL DEFAULT 0 CHECK (probability >= 0 AND probability <= 100),
  color       text        NOT NULL DEFAULT '#6366f1',
  is_closed   boolean     NOT NULL DEFAULT false,
  is_won      boolean     NOT NULL DEFAULT false,
  is_longterm boolean     NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (pipeline_id, name)
);

CREATE INDEX idx_pipeline_stages_pipeline_id ON pipeline_stages(pipeline_id);

CREATE TRIGGER set_pipeline_stages_updated_at
  BEFORE UPDATE ON pipeline_stages
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

ALTER TABLE pipeline_stages ENABLE ROW LEVEL SECURITY;

CREATE POLICY pipeline_stages_select ON pipeline_stages
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY pipeline_stages_insert ON pipeline_stages
  FOR INSERT TO authenticated
  WITH CHECK ((select public.get_user_role()) IN ('admin', 'sales_manager'));

CREATE POLICY pipeline_stages_update ON pipeline_stages
  FOR UPDATE TO authenticated
  USING ((select public.get_user_role()) IN ('admin', 'sales_manager'))
  WITH CHECK ((select public.get_user_role()) IN ('admin', 'sales_manager'));

CREATE POLICY pipeline_stages_delete ON pipeline_stages
  FOR DELETE TO authenticated
  USING ((select public.get_user_role()) IN ('admin', 'sales_manager'));

GRANT SELECT ON pipeline_stages TO authenticated;
GRANT ALL ON pipeline_stages TO service_role;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE pipeline_stages;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- Group 2: Indexation reference
-- ============================================================================

-- ── 3. indexation_indices ────────────────────────────────────────────────────

CREATE TABLE indexation_indices (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text        NOT NULL UNIQUE,
  value       numeric     NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_indexation_indices_name ON indexation_indices(name);

CREATE TRIGGER set_indexation_indices_updated_at
  BEFORE UPDATE ON indexation_indices
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

ALTER TABLE indexation_indices ENABLE ROW LEVEL SECURITY;

CREATE POLICY indexation_indices_select ON indexation_indices
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY indexation_indices_insert ON indexation_indices
  FOR INSERT TO authenticated
  WITH CHECK ((select public.get_user_role()) IN ('admin', 'sales_manager'));

CREATE POLICY indexation_indices_update ON indexation_indices
  FOR UPDATE TO authenticated
  USING ((select public.get_user_role()) IN ('admin', 'sales_manager'))
  WITH CHECK ((select public.get_user_role()) IN ('admin', 'sales_manager'));

CREATE POLICY indexation_indices_delete ON indexation_indices
  FOR DELETE TO authenticated
  USING ((select public.get_user_role()) IN ('admin', 'sales_manager'));

GRANT SELECT ON indexation_indices TO authenticated;
GRANT ALL ON indexation_indices TO service_role;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE indexation_indices;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- Group 3: ref_* lookup tables
-- All follow identical structure unless noted otherwise:
--   id UUID PK, name TEXT NOT NULL UNIQUE, sort_order INT DEFAULT 0,
--   active BOOLEAN DEFAULT true, created_at, updated_at
-- ============================================================================

-- ── 4. ref_competence_centers ────────────────────────────────────────────────

CREATE TABLE ref_competence_centers (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text        NOT NULL UNIQUE,
  sort_order  integer     NOT NULL DEFAULT 0,
  active      boolean     NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ref_competence_centers_name ON ref_competence_centers(name);

CREATE TRIGGER set_ref_competence_centers_updated_at
  BEFORE UPDATE ON ref_competence_centers
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

ALTER TABLE ref_competence_centers ENABLE ROW LEVEL SECURITY;

CREATE POLICY ref_competence_centers_select ON ref_competence_centers
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY ref_competence_centers_insert ON ref_competence_centers
  FOR INSERT TO authenticated
  WITH CHECK ((select public.get_user_role()) IN ('admin', 'sales_manager'));

CREATE POLICY ref_competence_centers_update ON ref_competence_centers
  FOR UPDATE TO authenticated
  USING ((select public.get_user_role()) IN ('admin', 'sales_manager'))
  WITH CHECK ((select public.get_user_role()) IN ('admin', 'sales_manager'));

CREATE POLICY ref_competence_centers_delete ON ref_competence_centers
  FOR DELETE TO authenticated
  USING ((select public.get_user_role()) IN ('admin', 'sales_manager'));

GRANT SELECT ON ref_competence_centers TO authenticated;
GRANT ALL ON ref_competence_centers TO service_role;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE ref_competence_centers;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── 5. ref_cc_services ───────────────────────────────────────────────────────

CREATE TABLE ref_cc_services (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text        NOT NULL UNIQUE,
  sort_order  integer     NOT NULL DEFAULT 0,
  active      boolean     NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ref_cc_services_name ON ref_cc_services(name);

CREATE TRIGGER set_ref_cc_services_updated_at
  BEFORE UPDATE ON ref_cc_services
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

ALTER TABLE ref_cc_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY ref_cc_services_select ON ref_cc_services
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY ref_cc_services_insert ON ref_cc_services
  FOR INSERT TO authenticated
  WITH CHECK ((select public.get_user_role()) IN ('admin', 'sales_manager'));

CREATE POLICY ref_cc_services_update ON ref_cc_services
  FOR UPDATE TO authenticated
  USING ((select public.get_user_role()) IN ('admin', 'sales_manager'))
  WITH CHECK ((select public.get_user_role()) IN ('admin', 'sales_manager'));

CREATE POLICY ref_cc_services_delete ON ref_cc_services
  FOR DELETE TO authenticated
  USING ((select public.get_user_role()) IN ('admin', 'sales_manager'));

GRANT SELECT ON ref_cc_services TO authenticated;
GRANT ALL ON ref_cc_services TO service_role;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE ref_cc_services;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── 6. ref_consultant_roles ──────────────────────────────────────────────────

CREATE TABLE ref_consultant_roles (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text        NOT NULL UNIQUE,
  sort_order  integer     NOT NULL DEFAULT 0,
  active      boolean     NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ref_consultant_roles_name ON ref_consultant_roles(name);

CREATE TRIGGER set_ref_consultant_roles_updated_at
  BEFORE UPDATE ON ref_consultant_roles
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

ALTER TABLE ref_consultant_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY ref_consultant_roles_select ON ref_consultant_roles
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY ref_consultant_roles_insert ON ref_consultant_roles
  FOR INSERT TO authenticated
  WITH CHECK ((select public.get_user_role()) IN ('admin', 'sales_manager'));

CREATE POLICY ref_consultant_roles_update ON ref_consultant_roles
  FOR UPDATE TO authenticated
  USING ((select public.get_user_role()) IN ('admin', 'sales_manager'))
  WITH CHECK ((select public.get_user_role()) IN ('admin', 'sales_manager'));

CREATE POLICY ref_consultant_roles_delete ON ref_consultant_roles
  FOR DELETE TO authenticated
  USING ((select public.get_user_role()) IN ('admin', 'sales_manager'));

GRANT SELECT ON ref_consultant_roles TO authenticated;
GRANT ALL ON ref_consultant_roles TO service_role;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE ref_consultant_roles;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── 7. ref_technologies ──────────────────────────────────────────────────────

CREATE TABLE ref_technologies (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text        NOT NULL UNIQUE,
  sort_order  integer     NOT NULL DEFAULT 0,
  active      boolean     NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ref_technologies_name ON ref_technologies(name);

CREATE TRIGGER set_ref_technologies_updated_at
  BEFORE UPDATE ON ref_technologies
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

ALTER TABLE ref_technologies ENABLE ROW LEVEL SECURITY;

CREATE POLICY ref_technologies_select ON ref_technologies
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY ref_technologies_insert ON ref_technologies
  FOR INSERT TO authenticated
  WITH CHECK ((select public.get_user_role()) IN ('admin', 'sales_manager'));

CREATE POLICY ref_technologies_update ON ref_technologies
  FOR UPDATE TO authenticated
  USING ((select public.get_user_role()) IN ('admin', 'sales_manager'))
  WITH CHECK ((select public.get_user_role()) IN ('admin', 'sales_manager'));

CREATE POLICY ref_technologies_delete ON ref_technologies
  FOR DELETE TO authenticated
  USING ((select public.get_user_role()) IN ('admin', 'sales_manager'));

GRANT SELECT ON ref_technologies TO authenticated;
GRANT ALL ON ref_technologies TO service_role;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE ref_technologies;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── 8. ref_hosting_providers ─────────────────────────────────────────────────

CREATE TABLE ref_hosting_providers (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text        NOT NULL UNIQUE,
  sort_order  integer     NOT NULL DEFAULT 0,
  active      boolean     NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ref_hosting_providers_name ON ref_hosting_providers(name);

CREATE TRIGGER set_ref_hosting_providers_updated_at
  BEFORE UPDATE ON ref_hosting_providers
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

ALTER TABLE ref_hosting_providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY ref_hosting_providers_select ON ref_hosting_providers
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY ref_hosting_providers_insert ON ref_hosting_providers
  FOR INSERT TO authenticated
  WITH CHECK ((select public.get_user_role()) IN ('admin', 'sales_manager'));

CREATE POLICY ref_hosting_providers_update ON ref_hosting_providers
  FOR UPDATE TO authenticated
  USING ((select public.get_user_role()) IN ('admin', 'sales_manager'))
  WITH CHECK ((select public.get_user_role()) IN ('admin', 'sales_manager'));

CREATE POLICY ref_hosting_providers_delete ON ref_hosting_providers
  FOR DELETE TO authenticated
  USING ((select public.get_user_role()) IN ('admin', 'sales_manager'));

GRANT SELECT ON ref_hosting_providers TO authenticated;
GRANT ALL ON ref_hosting_providers TO service_role;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE ref_hosting_providers;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── 9. ref_hosting_environments ──────────────────────────────────────────────

CREATE TABLE ref_hosting_environments (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text        NOT NULL UNIQUE,
  sort_order  integer     NOT NULL DEFAULT 0,
  active      boolean     NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ref_hosting_environments_name ON ref_hosting_environments(name);

CREATE TRIGGER set_ref_hosting_environments_updated_at
  BEFORE UPDATE ON ref_hosting_environments
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

ALTER TABLE ref_hosting_environments ENABLE ROW LEVEL SECURITY;

CREATE POLICY ref_hosting_environments_select ON ref_hosting_environments
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY ref_hosting_environments_insert ON ref_hosting_environments
  FOR INSERT TO authenticated
  WITH CHECK ((select public.get_user_role()) IN ('admin', 'sales_manager'));

CREATE POLICY ref_hosting_environments_update ON ref_hosting_environments
  FOR UPDATE TO authenticated
  USING ((select public.get_user_role()) IN ('admin', 'sales_manager'))
  WITH CHECK ((select public.get_user_role()) IN ('admin', 'sales_manager'));

CREATE POLICY ref_hosting_environments_delete ON ref_hosting_environments
  FOR DELETE TO authenticated
  USING ((select public.get_user_role()) IN ('admin', 'sales_manager'));

GRANT SELECT ON ref_hosting_environments TO authenticated;
GRANT ALL ON ref_hosting_environments TO service_role;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE ref_hosting_environments;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── 10. ref_languages ────────────────────────────────────────────────────────

CREATE TABLE ref_languages (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text        NOT NULL UNIQUE,
  sort_order  integer     NOT NULL DEFAULT 0,
  active      boolean     NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ref_languages_name ON ref_languages(name);

CREATE TRIGGER set_ref_languages_updated_at
  BEFORE UPDATE ON ref_languages
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

ALTER TABLE ref_languages ENABLE ROW LEVEL SECURITY;

CREATE POLICY ref_languages_select ON ref_languages
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY ref_languages_insert ON ref_languages
  FOR INSERT TO authenticated
  WITH CHECK ((select public.get_user_role()) IN ('admin', 'sales_manager'));

CREATE POLICY ref_languages_update ON ref_languages
  FOR UPDATE TO authenticated
  USING ((select public.get_user_role()) IN ('admin', 'sales_manager'))
  WITH CHECK ((select public.get_user_role()) IN ('admin', 'sales_manager'));

CREATE POLICY ref_languages_delete ON ref_languages
  FOR DELETE TO authenticated
  USING ((select public.get_user_role()) IN ('admin', 'sales_manager'));

GRANT SELECT ON ref_languages TO authenticated;
GRANT ALL ON ref_languages TO service_role;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE ref_languages;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── 11. ref_language_levels ──────────────────────────────────────────────────

CREATE TABLE ref_language_levels (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text        NOT NULL UNIQUE,
  sort_order  integer     NOT NULL DEFAULT 0,
  active      boolean     NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ref_language_levels_name ON ref_language_levels(name);

CREATE TRIGGER set_ref_language_levels_updated_at
  BEFORE UPDATE ON ref_language_levels
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

ALTER TABLE ref_language_levels ENABLE ROW LEVEL SECURITY;

CREATE POLICY ref_language_levels_select ON ref_language_levels
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY ref_language_levels_insert ON ref_language_levels
  FOR INSERT TO authenticated
  WITH CHECK ((select public.get_user_role()) IN ('admin', 'sales_manager'));

CREATE POLICY ref_language_levels_update ON ref_language_levels
  FOR UPDATE TO authenticated
  USING ((select public.get_user_role()) IN ('admin', 'sales_manager'))
  WITH CHECK ((select public.get_user_role()) IN ('admin', 'sales_manager'));

CREATE POLICY ref_language_levels_delete ON ref_language_levels
  FOR DELETE TO authenticated
  USING ((select public.get_user_role()) IN ('admin', 'sales_manager'));

GRANT SELECT ON ref_language_levels TO authenticated;
GRANT ALL ON ref_language_levels TO service_role;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE ref_language_levels;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── 12. ref_contact_roles ────────────────────────────────────────────────────

CREATE TABLE ref_contact_roles (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text        NOT NULL UNIQUE,
  sort_order  integer     NOT NULL DEFAULT 0,
  active      boolean     NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ref_contact_roles_name ON ref_contact_roles(name);

CREATE TRIGGER set_ref_contact_roles_updated_at
  BEFORE UPDATE ON ref_contact_roles
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

ALTER TABLE ref_contact_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY ref_contact_roles_select ON ref_contact_roles
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY ref_contact_roles_insert ON ref_contact_roles
  FOR INSERT TO authenticated
  WITH CHECK ((select public.get_user_role()) IN ('admin', 'sales_manager'));

CREATE POLICY ref_contact_roles_update ON ref_contact_roles
  FOR UPDATE TO authenticated
  USING ((select public.get_user_role()) IN ('admin', 'sales_manager'))
  WITH CHECK ((select public.get_user_role()) IN ('admin', 'sales_manager'));

CREATE POLICY ref_contact_roles_delete ON ref_contact_roles
  FOR DELETE TO authenticated
  USING ((select public.get_user_role()) IN ('admin', 'sales_manager'));

GRANT SELECT ON ref_contact_roles TO authenticated;
GRANT ALL ON ref_contact_roles TO service_role;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE ref_contact_roles;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── 13. ref_hobbies ──────────────────────────────────────────────────────────

CREATE TABLE ref_hobbies (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text        NOT NULL UNIQUE,
  sort_order  integer     NOT NULL DEFAULT 0,
  active      boolean     NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ref_hobbies_name ON ref_hobbies(name);

CREATE TRIGGER set_ref_hobbies_updated_at
  BEFORE UPDATE ON ref_hobbies
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

ALTER TABLE ref_hobbies ENABLE ROW LEVEL SECURITY;

CREATE POLICY ref_hobbies_select ON ref_hobbies
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY ref_hobbies_insert ON ref_hobbies
  FOR INSERT TO authenticated
  WITH CHECK ((select public.get_user_role()) IN ('admin', 'sales_manager'));

CREATE POLICY ref_hobbies_update ON ref_hobbies
  FOR UPDATE TO authenticated
  USING ((select public.get_user_role()) IN ('admin', 'sales_manager'))
  WITH CHECK ((select public.get_user_role()) IN ('admin', 'sales_manager'));

CREATE POLICY ref_hobbies_delete ON ref_hobbies
  FOR DELETE TO authenticated
  USING ((select public.get_user_role()) IN ('admin', 'sales_manager'));

GRANT SELECT ON ref_hobbies TO authenticated;
GRANT ALL ON ref_hobbies TO service_role;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE ref_hobbies;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── 14. ref_sla_tools ────────────────────────────────────────────────────────

CREATE TABLE ref_sla_tools (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text        NOT NULL UNIQUE,
  sort_order  integer     NOT NULL DEFAULT 0,
  active      boolean     NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ref_sla_tools_name ON ref_sla_tools(name);

CREATE TRIGGER set_ref_sla_tools_updated_at
  BEFORE UPDATE ON ref_sla_tools
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

ALTER TABLE ref_sla_tools ENABLE ROW LEVEL SECURITY;

CREATE POLICY ref_sla_tools_select ON ref_sla_tools
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY ref_sla_tools_insert ON ref_sla_tools
  FOR INSERT TO authenticated
  WITH CHECK ((select public.get_user_role()) IN ('admin', 'sales_manager'));

CREATE POLICY ref_sla_tools_update ON ref_sla_tools
  FOR UPDATE TO authenticated
  USING ((select public.get_user_role()) IN ('admin', 'sales_manager'))
  WITH CHECK ((select public.get_user_role()) IN ('admin', 'sales_manager'));

CREATE POLICY ref_sla_tools_delete ON ref_sla_tools
  FOR DELETE TO authenticated
  USING ((select public.get_user_role()) IN ('admin', 'sales_manager'));

GRANT SELECT ON ref_sla_tools TO authenticated;
GRANT ALL ON ref_sla_tools TO service_role;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE ref_sla_tools;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── 15. ref_collaboration_types ──────────────────────────────────────────────

CREATE TABLE ref_collaboration_types (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text        NOT NULL UNIQUE,
  sort_order  integer     NOT NULL DEFAULT 0,
  active      boolean     NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ref_collaboration_types_name ON ref_collaboration_types(name);

CREATE TRIGGER set_ref_collaboration_types_updated_at
  BEFORE UPDATE ON ref_collaboration_types
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

ALTER TABLE ref_collaboration_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY ref_collaboration_types_select ON ref_collaboration_types
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY ref_collaboration_types_insert ON ref_collaboration_types
  FOR INSERT TO authenticated
  WITH CHECK ((select public.get_user_role()) IN ('admin', 'sales_manager'));

CREATE POLICY ref_collaboration_types_update ON ref_collaboration_types
  FOR UPDATE TO authenticated
  USING ((select public.get_user_role()) IN ('admin', 'sales_manager'))
  WITH CHECK ((select public.get_user_role()) IN ('admin', 'sales_manager'));

CREATE POLICY ref_collaboration_types_delete ON ref_collaboration_types
  FOR DELETE TO authenticated
  USING ((select public.get_user_role()) IN ('admin', 'sales_manager'));

GRANT SELECT ON ref_collaboration_types TO authenticated;
GRANT ALL ON ref_collaboration_types TO service_role;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE ref_collaboration_types;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── 16. ref_stop_reasons ─────────────────────────────────────────────────────

CREATE TABLE ref_stop_reasons (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text        NOT NULL UNIQUE,
  sort_order  integer     NOT NULL DEFAULT 0,
  active      boolean     NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ref_stop_reasons_name ON ref_stop_reasons(name);

CREATE TRIGGER set_ref_stop_reasons_updated_at
  BEFORE UPDATE ON ref_stop_reasons
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

ALTER TABLE ref_stop_reasons ENABLE ROW LEVEL SECURITY;

CREATE POLICY ref_stop_reasons_select ON ref_stop_reasons
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY ref_stop_reasons_insert ON ref_stop_reasons
  FOR INSERT TO authenticated
  WITH CHECK ((select public.get_user_role()) IN ('admin', 'sales_manager'));

CREATE POLICY ref_stop_reasons_update ON ref_stop_reasons
  FOR UPDATE TO authenticated
  USING ((select public.get_user_role()) IN ('admin', 'sales_manager'))
  WITH CHECK ((select public.get_user_role()) IN ('admin', 'sales_manager'));

CREATE POLICY ref_stop_reasons_delete ON ref_stop_reasons
  FOR DELETE TO authenticated
  USING ((select public.get_user_role()) IN ('admin', 'sales_manager'));

GRANT SELECT ON ref_stop_reasons TO authenticated;
GRANT ALL ON ref_stop_reasons TO service_role;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE ref_stop_reasons;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── 17. ref_lead_sources ─────────────────────────────────────────────────────

CREATE TABLE ref_lead_sources (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text        NOT NULL UNIQUE,
  sort_order  integer     NOT NULL DEFAULT 0,
  active      boolean     NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ref_lead_sources_name ON ref_lead_sources(name);

CREATE TRIGGER set_ref_lead_sources_updated_at
  BEFORE UPDATE ON ref_lead_sources
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

ALTER TABLE ref_lead_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY ref_lead_sources_select ON ref_lead_sources
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY ref_lead_sources_insert ON ref_lead_sources
  FOR INSERT TO authenticated
  WITH CHECK ((select public.get_user_role()) IN ('admin', 'sales_manager'));

CREATE POLICY ref_lead_sources_update ON ref_lead_sources
  FOR UPDATE TO authenticated
  USING ((select public.get_user_role()) IN ('admin', 'sales_manager'))
  WITH CHECK ((select public.get_user_role()) IN ('admin', 'sales_manager'));

CREATE POLICY ref_lead_sources_delete ON ref_lead_sources
  FOR DELETE TO authenticated
  USING ((select public.get_user_role()) IN ('admin', 'sales_manager'));

GRANT SELECT ON ref_lead_sources TO authenticated;
GRANT ALL ON ref_lead_sources TO service_role;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE ref_lead_sources;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── 18. ref_distribution_types ───────────────────────────────────────────────

CREATE TABLE ref_distribution_types (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text        NOT NULL UNIQUE,
  sort_order  integer     NOT NULL DEFAULT 0,
  active      boolean     NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ref_distribution_types_name ON ref_distribution_types(name);

CREATE TRIGGER set_ref_distribution_types_updated_at
  BEFORE UPDATE ON ref_distribution_types
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

ALTER TABLE ref_distribution_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY ref_distribution_types_select ON ref_distribution_types
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY ref_distribution_types_insert ON ref_distribution_types
  FOR INSERT TO authenticated
  WITH CHECK ((select public.get_user_role()) IN ('admin', 'sales_manager'));

CREATE POLICY ref_distribution_types_update ON ref_distribution_types
  FOR UPDATE TO authenticated
  USING ((select public.get_user_role()) IN ('admin', 'sales_manager'))
  WITH CHECK ((select public.get_user_role()) IN ('admin', 'sales_manager'));

CREATE POLICY ref_distribution_types_delete ON ref_distribution_types
  FOR DELETE TO authenticated
  USING ((select public.get_user_role()) IN ('admin', 'sales_manager'));

GRANT SELECT ON ref_distribution_types TO authenticated;
GRANT ALL ON ref_distribution_types TO service_role;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE ref_distribution_types;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── 19. ref_internal_people (extra columns: email, avatar_url) ───────────────

CREATE TABLE ref_internal_people (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text        NOT NULL UNIQUE,
  email       text,
  avatar_url  text,
  sort_order  integer     NOT NULL DEFAULT 0,
  active      boolean     NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ref_internal_people_name ON ref_internal_people(name);

CREATE TRIGGER set_ref_internal_people_updated_at
  BEFORE UPDATE ON ref_internal_people
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

ALTER TABLE ref_internal_people ENABLE ROW LEVEL SECURITY;

CREATE POLICY ref_internal_people_select ON ref_internal_people
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY ref_internal_people_insert ON ref_internal_people
  FOR INSERT TO authenticated
  WITH CHECK ((select public.get_user_role()) IN ('admin', 'sales_manager'));

CREATE POLICY ref_internal_people_update ON ref_internal_people
  FOR UPDATE TO authenticated
  USING ((select public.get_user_role()) IN ('admin', 'sales_manager'))
  WITH CHECK ((select public.get_user_role()) IN ('admin', 'sales_manager'));

CREATE POLICY ref_internal_people_delete ON ref_internal_people
  FOR DELETE TO authenticated
  USING ((select public.get_user_role()) IN ('admin', 'sales_manager'));

GRANT SELECT ON ref_internal_people TO authenticated;
GRANT ALL ON ref_internal_people TO service_role;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE ref_internal_people;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── 20. ref_teams ────────────────────────────────────────────────────────────

CREATE TABLE ref_teams (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text        NOT NULL UNIQUE,
  sort_order  integer     NOT NULL DEFAULT 0,
  active      boolean     NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ref_teams_name ON ref_teams(name);

CREATE TRIGGER set_ref_teams_updated_at
  BEFORE UPDATE ON ref_teams
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

ALTER TABLE ref_teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY ref_teams_select ON ref_teams
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY ref_teams_insert ON ref_teams
  FOR INSERT TO authenticated
  WITH CHECK ((select public.get_user_role()) IN ('admin', 'sales_manager'));

CREATE POLICY ref_teams_update ON ref_teams
  FOR UPDATE TO authenticated
  USING ((select public.get_user_role()) IN ('admin', 'sales_manager'))
  WITH CHECK ((select public.get_user_role()) IN ('admin', 'sales_manager'));

CREATE POLICY ref_teams_delete ON ref_teams
  FOR DELETE TO authenticated
  USING ((select public.get_user_role()) IN ('admin', 'sales_manager'));

GRANT SELECT ON ref_teams TO authenticated;
GRANT ALL ON ref_teams TO service_role;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE ref_teams;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
