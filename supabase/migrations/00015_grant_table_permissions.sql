-- ============================================================================
-- Fix: Grant table-level permissions to authenticated role
-- RLS policies require these grants to function. Without them, all queries
-- from the Supabase client return "permission denied for table".
-- ============================================================================

-- All public tables need SELECT for authenticated users
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;

-- Tables that authenticated users can insert into
GRANT INSERT ON public.accounts TO authenticated;
GRANT INSERT ON public.contacts TO authenticated;
GRANT INSERT ON public.contact_personal_info TO authenticated;
GRANT INSERT ON public.communications TO authenticated;
GRANT INSERT ON public.notifications TO authenticated;
GRANT INSERT ON public.audit_logs TO authenticated;
GRANT INSERT ON public.account_competence_centers TO authenticated;
GRANT INSERT ON public.account_hosting TO authenticated;
GRANT INSERT ON public.account_manual_services TO authenticated;
GRANT INSERT ON public.account_samenwerkingsvormen TO authenticated;
GRANT INSERT ON public.account_services TO authenticated;
GRANT INSERT ON public.account_tech_stacks TO authenticated;
GRANT INSERT ON public.pipelines TO authenticated;
GRANT INSERT ON public.pipeline_stages TO authenticated;
GRANT INSERT ON public.app_settings TO authenticated;

-- Tables that authenticated users can update
GRANT UPDATE ON public.accounts TO authenticated;
GRANT UPDATE ON public.contacts TO authenticated;
GRANT UPDATE ON public.contact_personal_info TO authenticated;
GRANT UPDATE ON public.communications TO authenticated;
GRANT UPDATE ON public.notifications TO authenticated;
GRANT UPDATE ON public.user_profiles TO authenticated;
GRANT UPDATE ON public.account_competence_centers TO authenticated;
GRANT UPDATE ON public.account_hosting TO authenticated;
GRANT UPDATE ON public.account_manual_services TO authenticated;
GRANT UPDATE ON public.account_samenwerkingsvormen TO authenticated;
GRANT UPDATE ON public.account_services TO authenticated;
GRANT UPDATE ON public.account_tech_stacks TO authenticated;
GRANT UPDATE ON public.pipelines TO authenticated;
GRANT UPDATE ON public.pipeline_stages TO authenticated;
GRANT UPDATE ON public.app_settings TO authenticated;

-- Tables that authenticated users can delete from
GRANT DELETE ON public.accounts TO authenticated;
GRANT DELETE ON public.contacts TO authenticated;
GRANT DELETE ON public.contact_personal_info TO authenticated;
GRANT DELETE ON public.communications TO authenticated;
GRANT DELETE ON public.notifications TO authenticated;
GRANT DELETE ON public.account_competence_centers TO authenticated;
GRANT DELETE ON public.account_hosting TO authenticated;
GRANT DELETE ON public.account_manual_services TO authenticated;
GRANT DELETE ON public.account_samenwerkingsvormen TO authenticated;
GRANT DELETE ON public.account_services TO authenticated;
GRANT DELETE ON public.account_tech_stacks TO authenticated;
GRANT DELETE ON public.pipelines TO authenticated;
GRANT DELETE ON public.pipeline_stages TO authenticated;

-- Ensure future tables in public schema also get SELECT
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO authenticated;

-- ============================================================================
-- Service role: full access to all public tables.
-- service_role bypasses RLS but still requires table-level grants.
-- Used by createServiceRoleClient() for admin operations (user listing, audit).
-- ============================================================================
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;
