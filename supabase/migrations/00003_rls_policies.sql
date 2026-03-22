-- Enable RLS on tables created in earlier migrations
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- ── user_profiles policies ──────────────────────
DROP POLICY IF EXISTS "users_can_read_profiles" ON public.user_profiles;
CREATE POLICY "users_can_read_profiles" ON public.user_profiles
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "profiles_insert_blocked" ON public.user_profiles;
CREATE POLICY "profiles_insert_blocked" ON public.user_profiles
  FOR INSERT TO authenticated WITH CHECK (false);

DROP POLICY IF EXISTS "users_can_update_own_profile" ON public.user_profiles;
CREATE POLICY "users_can_update_own_profile" ON public.user_profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "profiles_delete_blocked" ON public.user_profiles;
CREATE POLICY "profiles_delete_blocked" ON public.user_profiles
  FOR DELETE TO authenticated USING (false);

-- ── app_settings policies (using inlined EXISTS for performance) ──
DROP POLICY IF EXISTS "authenticated_can_read_settings" ON public.app_settings;
CREATE POLICY "authenticated_can_read_settings" ON public.app_settings
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'editor', 'viewer')
    )
  );

DROP POLICY IF EXISTS "admins_can_write_settings" ON public.app_settings;
CREATE POLICY "admins_can_write_settings" ON public.app_settings
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "admins_can_update_settings" ON public.app_settings;
CREATE POLICY "admins_can_update_settings" ON public.app_settings
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "admins_can_delete_settings" ON public.app_settings;
CREATE POLICY "admins_can_delete_settings" ON public.app_settings
  FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Contacts RLS policies moved to 00012_contacts.sql (contacts table created there)
