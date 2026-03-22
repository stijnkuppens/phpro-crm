-- ============================================================================
-- Fix remaining Supabase lint warnings:
-- 1. auth_rls_initplan: wrap auth.uid() in (select ...) for per-query eval
-- 2. multiple_permissive_policies: drop redundant _select policies
-- ============================================================================

-- ── 1. Fix auth_rls_initplan: re-create policies with (select auth.uid()) ─

-- user_profiles
DROP POLICY IF EXISTS "users_can_update_own_profile" ON user_profiles;
CREATE POLICY "users_can_update_own_profile" ON user_profiles
  FOR UPDATE TO authenticated
  USING (id = (select auth.uid()))
  WITH CHECK (id = (select auth.uid()));

-- app_settings
DROP POLICY IF EXISTS "admins_can_write_settings" ON app_settings;
CREATE POLICY "admins_can_write_settings" ON app_settings
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = (select auth.uid()) AND role = 'admin')
  );

DROP POLICY IF EXISTS "admins_can_update_settings" ON app_settings;
CREATE POLICY "admins_can_update_settings" ON app_settings
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = (select auth.uid()) AND role = 'admin')
  );

DROP POLICY IF EXISTS "admins_can_delete_settings" ON app_settings;
CREATE POLICY "admins_can_delete_settings" ON app_settings
  FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = (select auth.uid()) AND role = 'admin')
  );

-- audit_logs
DROP POLICY IF EXISTS "audit_logs_select" ON audit_logs;
CREATE POLICY "audit_logs_select" ON audit_logs
  FOR SELECT TO authenticated USING (
    user_id = (select auth.uid()) OR EXISTS (
      SELECT 1 FROM user_profiles WHERE id = (select auth.uid()) AND role = 'admin'
    )
  );

-- notifications
DROP POLICY IF EXISTS "notifications_select" ON notifications;
CREATE POLICY "notifications_select" ON notifications
  FOR SELECT TO authenticated USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "notifications_update" ON notifications;
CREATE POLICY "notifications_update" ON notifications
  FOR UPDATE TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- account_cc_services
DROP POLICY IF EXISTS "account_cc_services_insert" ON account_cc_services;
CREATE POLICY "account_cc_services_insert" ON account_cc_services
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = (select auth.uid()) AND role IN ('admin','sales_manager','sales_rep'))
  );

DROP POLICY IF EXISTS "account_cc_services_update" ON account_cc_services;
CREATE POLICY "account_cc_services_update" ON account_cc_services
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = (select auth.uid()) AND role IN ('admin','sales_manager','sales_rep'))
  );

DROP POLICY IF EXISTS "account_cc_services_delete" ON account_cc_services;
CREATE POLICY "account_cc_services_delete" ON account_cc_services
  FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = (select auth.uid()) AND role IN ('admin','sales_manager','sales_rep'))
  );

-- ref_lead_sources
DROP POLICY IF EXISTS "ref_lead_sources_insert" ON ref_lead_sources;
CREATE POLICY "ref_lead_sources_insert" ON ref_lead_sources
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = (select auth.uid()) AND role = 'admin')
  );

DROP POLICY IF EXISTS "ref_lead_sources_update" ON ref_lead_sources;
CREATE POLICY "ref_lead_sources_update" ON ref_lead_sources
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = (select auth.uid()) AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = (select auth.uid()) AND role = 'admin'));

DROP POLICY IF EXISTS "ref_lead_sources_delete" ON ref_lead_sources;
CREATE POLICY "ref_lead_sources_delete" ON ref_lead_sources
  FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = (select auth.uid()) AND role = 'admin')
  );

-- ref_distribution_types
DROP POLICY IF EXISTS "ref_distribution_types_insert" ON ref_distribution_types;
CREATE POLICY "ref_distribution_types_insert" ON ref_distribution_types
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = (select auth.uid()) AND role = 'admin')
  );

DROP POLICY IF EXISTS "ref_distribution_types_update" ON ref_distribution_types;
CREATE POLICY "ref_distribution_types_update" ON ref_distribution_types
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = (select auth.uid()) AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = (select auth.uid()) AND role = 'admin'));

DROP POLICY IF EXISTS "ref_distribution_types_delete" ON ref_distribution_types;
CREATE POLICY "ref_distribution_types_delete" ON ref_distribution_types
  FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = (select auth.uid()) AND role = 'admin')
  );

-- ref_teams
DROP POLICY IF EXISTS "ref_teams_insert" ON ref_teams;
CREATE POLICY "ref_teams_insert" ON ref_teams
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = (select auth.uid()) AND role = 'admin')
  );

DROP POLICY IF EXISTS "ref_teams_update" ON ref_teams;
CREATE POLICY "ref_teams_update" ON ref_teams
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = (select auth.uid()) AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = (select auth.uid()) AND role = 'admin'));

DROP POLICY IF EXISTS "ref_teams_delete" ON ref_teams;
CREATE POLICY "ref_teams_delete" ON ref_teams
  FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = (select auth.uid()) AND role = 'admin')
  );

-- ref_internal_people
DROP POLICY IF EXISTS "ref_internal_people_insert" ON ref_internal_people;
CREATE POLICY "ref_internal_people_insert" ON ref_internal_people
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = (select auth.uid()) AND role = 'admin')
  );

DROP POLICY IF EXISTS "ref_internal_people_update" ON ref_internal_people;
CREATE POLICY "ref_internal_people_update" ON ref_internal_people
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = (select auth.uid()) AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = (select auth.uid()) AND role = 'admin'));

DROP POLICY IF EXISTS "ref_internal_people_delete" ON ref_internal_people;
CREATE POLICY "ref_internal_people_delete" ON ref_internal_people
  FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = (select auth.uid()) AND role = 'admin')
  );

-- ── 2. Drop redundant _select policies (ALL policy already covers SELECT) ─

DROP POLICY IF EXISTS "consultant_contract_attributions_select" ON consultant_contract_attributions;
DROP POLICY IF EXISTS "consultant_extensions_select" ON consultant_extensions;
DROP POLICY IF EXISTS "consultant_languages_select" ON consultant_languages;
DROP POLICY IF EXISTS "consultant_rate_history_select" ON consultant_rate_history;
DROP POLICY IF EXISTS "division_services_select" ON division_services;
DROP POLICY IF EXISTS "divisions_select" ON divisions;
DROP POLICY IF EXISTS "indexation_config_select" ON indexation_config;
DROP POLICY IF EXISTS "indexation_draft_rates_select" ON indexation_draft_rates;
DROP POLICY IF EXISTS "indexation_draft_sla_select" ON indexation_draft_sla;
DROP POLICY IF EXISTS "indexation_draft_sla_tools_select" ON indexation_draft_sla_tools;
DROP POLICY IF EXISTS "indexation_history_select" ON indexation_history;
DROP POLICY IF EXISTS "indexation_history_rates_select" ON indexation_history_rates;
DROP POLICY IF EXISTS "indexation_history_sla_select" ON indexation_history_sla;
DROP POLICY IF EXISTS "indexation_history_sla_tools_select" ON indexation_history_sla_tools;
DROP POLICY IF EXISTS "Authenticated users can read indexation indices" ON indexation_indices;
DROP POLICY IF EXISTS "revenue_client_divisions_select" ON revenue_client_divisions;
DROP POLICY IF EXISTS "revenue_client_services_select" ON revenue_client_services;
DROP POLICY IF EXISTS "sla_tools_select" ON sla_tools;
