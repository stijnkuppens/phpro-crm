-- Update the role check constraint to support new roles
-- Migrate existing users from old roles to new roles
UPDATE user_profiles SET role = 'sales_rep' WHERE role = 'editor';
UPDATE user_profiles SET role = 'marketing' WHERE role = 'viewer';

-- Update default role for new user trigger
ALTER TABLE user_profiles ALTER COLUMN role SET DEFAULT 'sales_rep';

ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_role_check;
ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_role_check
  CHECK (role IN ('admin', 'sales_manager', 'sales_rep', 'customer_success', 'marketing'));

-- Update the get_user_role function (used by RLS policies)
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_profiles WHERE id = auth.uid();
$$;

-- Update handle_new_user to use valid default role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, full_name, avatar_url, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
    'sales_rep'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ── Update storage policies to use new role names ─────────────────────
-- Old policies reference 'editor' which no longer exists

DROP POLICY IF EXISTS "editors_can_upload_avatars" ON storage.objects;
CREATE POLICY "crm_users_can_upload_avatars" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'avatars' AND public.get_user_role() IN ('admin', 'sales_manager', 'sales_rep', 'customer_success')
  );

DROP POLICY IF EXISTS "editors_can_update_avatars" ON storage.objects;
CREATE POLICY "crm_users_can_update_avatars" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND public.get_user_role() IN ('admin', 'sales_manager', 'sales_rep', 'customer_success'))
  WITH CHECK (bucket_id = 'avatars' AND public.get_user_role() IN ('admin', 'sales_manager', 'sales_rep', 'customer_success'));

DROP POLICY IF EXISTS "editors_can_upload_documents" ON storage.objects;
CREATE POLICY "crm_users_can_upload_documents" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'documents' AND public.get_user_role() IN ('admin', 'sales_manager', 'sales_rep', 'customer_success')
  );

DROP POLICY IF EXISTS "editors_can_update_documents" ON storage.objects;
CREATE POLICY "crm_users_can_update_documents" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'documents' AND public.get_user_role() IN ('admin', 'sales_manager', 'sales_rep', 'customer_success'))
  WITH CHECK (bucket_id = 'documents' AND public.get_user_role() IN ('admin', 'sales_manager', 'sales_rep', 'customer_success'));

-- ── Update app_settings policy to use new roles ──────────────────────
DROP POLICY IF EXISTS "authenticated_can_read_settings" ON public.app_settings;
CREATE POLICY "authenticated_can_read_settings" ON public.app_settings
  FOR SELECT TO authenticated USING (true);
