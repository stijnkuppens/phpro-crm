-- Reference table RLS policies used a subquery instead of get_user_role().
-- Standardise all 13 ref tables to use get_user_role() for consistency with the rest of the schema.

-- ── 1. ref_competence_centers ─────────────────────────────────────────────
DROP POLICY IF EXISTS "ref_competence_centers_insert" ON ref_competence_centers;
DROP POLICY IF EXISTS "ref_competence_centers_update" ON ref_competence_centers;
DROP POLICY IF EXISTS "ref_competence_centers_delete" ON ref_competence_centers;

CREATE POLICY "ref_competence_centers_insert" ON ref_competence_centers FOR INSERT TO authenticated
  WITH CHECK (get_user_role() = 'admin');
CREATE POLICY "ref_competence_centers_update" ON ref_competence_centers FOR UPDATE TO authenticated
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');
CREATE POLICY "ref_competence_centers_delete" ON ref_competence_centers FOR DELETE TO authenticated
  USING (get_user_role() = 'admin');

-- ── 2. ref_cc_services ────────────────────────────────────────────────────
DROP POLICY IF EXISTS "ref_cc_services_insert" ON ref_cc_services;
DROP POLICY IF EXISTS "ref_cc_services_update" ON ref_cc_services;
DROP POLICY IF EXISTS "ref_cc_services_delete" ON ref_cc_services;

CREATE POLICY "ref_cc_services_insert" ON ref_cc_services FOR INSERT TO authenticated
  WITH CHECK (get_user_role() = 'admin');
CREATE POLICY "ref_cc_services_update" ON ref_cc_services FOR UPDATE TO authenticated
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');
CREATE POLICY "ref_cc_services_delete" ON ref_cc_services FOR DELETE TO authenticated
  USING (get_user_role() = 'admin');

-- ── 3. ref_consultant_roles ───────────────────────────────────────────────
DROP POLICY IF EXISTS "ref_consultant_roles_insert" ON ref_consultant_roles;
DROP POLICY IF EXISTS "ref_consultant_roles_update" ON ref_consultant_roles;
DROP POLICY IF EXISTS "ref_consultant_roles_delete" ON ref_consultant_roles;

CREATE POLICY "ref_consultant_roles_insert" ON ref_consultant_roles FOR INSERT TO authenticated
  WITH CHECK (get_user_role() = 'admin');
CREATE POLICY "ref_consultant_roles_update" ON ref_consultant_roles FOR UPDATE TO authenticated
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');
CREATE POLICY "ref_consultant_roles_delete" ON ref_consultant_roles FOR DELETE TO authenticated
  USING (get_user_role() = 'admin');

-- ── 4. ref_technologies ───────────────────────────────────────────────────
DROP POLICY IF EXISTS "ref_technologies_insert" ON ref_technologies;
DROP POLICY IF EXISTS "ref_technologies_update" ON ref_technologies;
DROP POLICY IF EXISTS "ref_technologies_delete" ON ref_technologies;

CREATE POLICY "ref_technologies_insert" ON ref_technologies FOR INSERT TO authenticated
  WITH CHECK (get_user_role() = 'admin');
CREATE POLICY "ref_technologies_update" ON ref_technologies FOR UPDATE TO authenticated
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');
CREATE POLICY "ref_technologies_delete" ON ref_technologies FOR DELETE TO authenticated
  USING (get_user_role() = 'admin');

-- ── 5. ref_hosting_providers ──────────────────────────────────────────────
DROP POLICY IF EXISTS "ref_hosting_providers_insert" ON ref_hosting_providers;
DROP POLICY IF EXISTS "ref_hosting_providers_update" ON ref_hosting_providers;
DROP POLICY IF EXISTS "ref_hosting_providers_delete" ON ref_hosting_providers;

CREATE POLICY "ref_hosting_providers_insert" ON ref_hosting_providers FOR INSERT TO authenticated
  WITH CHECK (get_user_role() = 'admin');
CREATE POLICY "ref_hosting_providers_update" ON ref_hosting_providers FOR UPDATE TO authenticated
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');
CREATE POLICY "ref_hosting_providers_delete" ON ref_hosting_providers FOR DELETE TO authenticated
  USING (get_user_role() = 'admin');

-- ── 6. ref_hosting_environments ───────────────────────────────────────────
DROP POLICY IF EXISTS "ref_hosting_environments_insert" ON ref_hosting_environments;
DROP POLICY IF EXISTS "ref_hosting_environments_update" ON ref_hosting_environments;
DROP POLICY IF EXISTS "ref_hosting_environments_delete" ON ref_hosting_environments;

CREATE POLICY "ref_hosting_environments_insert" ON ref_hosting_environments FOR INSERT TO authenticated
  WITH CHECK (get_user_role() = 'admin');
CREATE POLICY "ref_hosting_environments_update" ON ref_hosting_environments FOR UPDATE TO authenticated
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');
CREATE POLICY "ref_hosting_environments_delete" ON ref_hosting_environments FOR DELETE TO authenticated
  USING (get_user_role() = 'admin');

-- ── 7. ref_languages ──────────────────────────────────────────────────────
DROP POLICY IF EXISTS "ref_languages_insert" ON ref_languages;
DROP POLICY IF EXISTS "ref_languages_update" ON ref_languages;
DROP POLICY IF EXISTS "ref_languages_delete" ON ref_languages;

CREATE POLICY "ref_languages_insert" ON ref_languages FOR INSERT TO authenticated
  WITH CHECK (get_user_role() = 'admin');
CREATE POLICY "ref_languages_update" ON ref_languages FOR UPDATE TO authenticated
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');
CREATE POLICY "ref_languages_delete" ON ref_languages FOR DELETE TO authenticated
  USING (get_user_role() = 'admin');

-- ── 8. ref_language_levels ────────────────────────────────────────────────
DROP POLICY IF EXISTS "ref_language_levels_insert" ON ref_language_levels;
DROP POLICY IF EXISTS "ref_language_levels_update" ON ref_language_levels;
DROP POLICY IF EXISTS "ref_language_levels_delete" ON ref_language_levels;

CREATE POLICY "ref_language_levels_insert" ON ref_language_levels FOR INSERT TO authenticated
  WITH CHECK (get_user_role() = 'admin');
CREATE POLICY "ref_language_levels_update" ON ref_language_levels FOR UPDATE TO authenticated
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');
CREATE POLICY "ref_language_levels_delete" ON ref_language_levels FOR DELETE TO authenticated
  USING (get_user_role() = 'admin');

-- ── 9. ref_contact_roles ──────────────────────────────────────────────────
DROP POLICY IF EXISTS "ref_contact_roles_insert" ON ref_contact_roles;
DROP POLICY IF EXISTS "ref_contact_roles_update" ON ref_contact_roles;
DROP POLICY IF EXISTS "ref_contact_roles_delete" ON ref_contact_roles;

CREATE POLICY "ref_contact_roles_insert" ON ref_contact_roles FOR INSERT TO authenticated
  WITH CHECK (get_user_role() = 'admin');
CREATE POLICY "ref_contact_roles_update" ON ref_contact_roles FOR UPDATE TO authenticated
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');
CREATE POLICY "ref_contact_roles_delete" ON ref_contact_roles FOR DELETE TO authenticated
  USING (get_user_role() = 'admin');

-- ── 10. ref_hobbies ───────────────────────────────────────────────────────
DROP POLICY IF EXISTS "ref_hobbies_insert" ON ref_hobbies;
DROP POLICY IF EXISTS "ref_hobbies_update" ON ref_hobbies;
DROP POLICY IF EXISTS "ref_hobbies_delete" ON ref_hobbies;

CREATE POLICY "ref_hobbies_insert" ON ref_hobbies FOR INSERT TO authenticated
  WITH CHECK (get_user_role() = 'admin');
CREATE POLICY "ref_hobbies_update" ON ref_hobbies FOR UPDATE TO authenticated
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');
CREATE POLICY "ref_hobbies_delete" ON ref_hobbies FOR DELETE TO authenticated
  USING (get_user_role() = 'admin');

-- ── 11. ref_sla_tools ─────────────────────────────────────────────────────
DROP POLICY IF EXISTS "ref_sla_tools_insert" ON ref_sla_tools;
DROP POLICY IF EXISTS "ref_sla_tools_update" ON ref_sla_tools;
DROP POLICY IF EXISTS "ref_sla_tools_delete" ON ref_sla_tools;

CREATE POLICY "ref_sla_tools_insert" ON ref_sla_tools FOR INSERT TO authenticated
  WITH CHECK (get_user_role() = 'admin');
CREATE POLICY "ref_sla_tools_update" ON ref_sla_tools FOR UPDATE TO authenticated
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');
CREATE POLICY "ref_sla_tools_delete" ON ref_sla_tools FOR DELETE TO authenticated
  USING (get_user_role() = 'admin');

-- ── 12. ref_collaboration_types ───────────────────────────────────────────
DROP POLICY IF EXISTS "ref_collaboration_types_insert" ON ref_collaboration_types;
DROP POLICY IF EXISTS "ref_collaboration_types_update" ON ref_collaboration_types;
DROP POLICY IF EXISTS "ref_collaboration_types_delete" ON ref_collaboration_types;

CREATE POLICY "ref_collaboration_types_insert" ON ref_collaboration_types FOR INSERT TO authenticated
  WITH CHECK (get_user_role() = 'admin');
CREATE POLICY "ref_collaboration_types_update" ON ref_collaboration_types FOR UPDATE TO authenticated
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');
CREATE POLICY "ref_collaboration_types_delete" ON ref_collaboration_types FOR DELETE TO authenticated
  USING (get_user_role() = 'admin');

-- ── 13. ref_stop_reasons ──────────────────────────────────────────────────
DROP POLICY IF EXISTS "ref_stop_reasons_insert" ON ref_stop_reasons;
DROP POLICY IF EXISTS "ref_stop_reasons_update" ON ref_stop_reasons;
DROP POLICY IF EXISTS "ref_stop_reasons_delete" ON ref_stop_reasons;

CREATE POLICY "ref_stop_reasons_insert" ON ref_stop_reasons FOR INSERT TO authenticated
  WITH CHECK (get_user_role() = 'admin');
CREATE POLICY "ref_stop_reasons_update" ON ref_stop_reasons FOR UPDATE TO authenticated
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');
CREATE POLICY "ref_stop_reasons_delete" ON ref_stop_reasons FOR DELETE TO authenticated
  USING (get_user_role() = 'admin');
