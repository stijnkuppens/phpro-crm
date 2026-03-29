-- Security hardening: restrict RLS policies to appropriate roles
-- Fixes: H2 (contact_personal_info over-broad SELECT), H4 (broken storage update/delete),
--        M1 (audit_logs over-broad SELECT), M8 (audit_logs INSERT allows forged user_id)

-- H2: Restrict contact_personal_info SELECT to roles that need it
DROP POLICY IF EXISTS contact_personal_info_select ON public.contact_personal_info;
CREATE POLICY contact_personal_info_select ON public.contact_personal_info
  FOR SELECT TO authenticated
  USING (
    (SELECT (raw_app_meta_data->>'role')::text FROM auth.users WHERE id = auth.uid())
    IN ('admin', 'sales_manager', 'sales_rep', 'customer_success')
  );

-- H4: Remove broken storage update/delete policies for avatars bucket
-- These policies incorrectly checked foldername[1] = auth.uid() but paths are
-- accounts/{entity_id}/... and contacts/{entity_id}/... — update/delete goes via
-- the service role client (createServiceRoleClient) so these policies are not needed.
DROP POLICY IF EXISTS avatars_update ON storage.objects;
DROP POLICY IF EXISTS avatars_delete ON storage.objects;

-- M1: Restrict audit_logs SELECT to admin and sales_manager only
DROP POLICY IF EXISTS audit_logs_select ON public.audit_logs;
CREATE POLICY audit_logs_select ON public.audit_logs
  FOR SELECT TO authenticated
  USING (
    (SELECT (raw_app_meta_data->>'role')::text FROM auth.users WHERE id = auth.uid())
    IN ('admin', 'sales_manager')
  );

-- M8: Restrict audit_logs INSERT so users can only insert entries for themselves
DROP POLICY IF EXISTS audit_logs_insert ON public.audit_logs;
CREATE POLICY audit_logs_insert ON public.audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
