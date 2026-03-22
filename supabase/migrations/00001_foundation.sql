/*
  Migration: Foundation
  Creates the core infrastructure tables, functions, and policies:
  - Extensions: moddatetime
  - Tables: user_profiles, app_settings, audit_logs, notifications
  - Functions: get_user_role(), handle_new_user(), prevent_role_change()
  - Triggers: auto-create profile on signup, updated_at, role change guard
  - RLS policies and grants for all four tables
  - Realtime publication for notifications
*/

-- ── Extensions ──────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS moddatetime SCHEMA extensions;

-- ── Tables ──────────────────────────────────────────────────────────────────

-- User profiles (extends auth.users)
CREATE TABLE public.user_profiles (
  id         uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role       text NOT NULL DEFAULT 'viewer'
             CHECK (role IN ('admin', 'sales_manager', 'sales_rep', 'marketing', 'viewer')),
  full_name  text NOT NULL DEFAULT '',
  avatar_url text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_profiles_role ON public.user_profiles(role);

-- App settings (key-value store)
CREATE TABLE public.app_settings (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key        text NOT NULL UNIQUE,
  value      jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Audit logs (append-only)
CREATE TABLE public.audit_logs (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action     text NOT NULL,
  entity     text,
  entity_id  uuid,
  metadata   jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_entity ON public.audit_logs(entity, entity_id);
CREATE INDEX idx_audit_logs_user ON public.audit_logs(user_id);

-- Notifications
CREATE TABLE public.notifications (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type       text,
  title      text NOT NULL,
  message    text,
  read       boolean NOT NULL DEFAULT false,
  metadata   jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id, read, created_at DESC);

-- ── Updated_at triggers (moddatetime) ───────────────────────────────────────

CREATE TRIGGER set_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

CREATE TRIGGER set_app_settings_updated_at
  BEFORE UPDATE ON public.app_settings
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

-- ── Functions ───────────────────────────────────────────────────────────────

-- Get current user role: check JWT app_metadata first (set by sync_role_to_jwt
-- trigger in 00014), fall back to DB lookup for tokens issued before sync.
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text AS $$
  SELECT COALESCE(
    auth.jwt() -> 'app_metadata' ->> 'role',
    (SELECT role FROM public.user_profiles WHERE id = (SELECT auth.uid()))
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Prevent non-admin role escalation
CREATE OR REPLACE FUNCTION public.prevent_role_change()
RETURNS trigger AS $$
BEGIN
  -- In non-session context (migration, service role), auth.uid() is NULL — allow
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;
  IF NEW.role != OLD.role AND (SELECT public.get_user_role()) != 'admin' THEN
    RAISE EXCEPTION 'Only admins can change user roles';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER guard_role_change
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_role_change();

-- NOTE: sync_role_to_jwt() trigger is defined in 00014_jwt_claims.sql
-- (it writes role to auth.users.raw_app_meta_data for JWT embedding)

-- ── RLS ─────────────────────────────────────────────────────────────────────

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- user_profiles: all authenticated can read
CREATE POLICY user_profiles_select ON public.user_profiles
  FOR SELECT TO authenticated
  USING (true);

-- user_profiles: users can update their own profile
CREATE POLICY user_profiles_update ON public.user_profiles
  FOR UPDATE TO authenticated
  USING (id = (SELECT auth.uid()))
  WITH CHECK (id = (SELECT auth.uid()));

-- user_profiles: admins can do everything
CREATE POLICY user_profiles_admin_insert ON public.user_profiles
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.get_user_role()) = 'admin');

CREATE POLICY user_profiles_admin_delete ON public.user_profiles
  FOR DELETE TO authenticated
  USING ((SELECT public.get_user_role()) = 'admin');

-- app_settings: all authenticated can read
CREATE POLICY app_settings_select ON public.app_settings
  FOR SELECT TO authenticated
  USING (true);

-- app_settings: only admins can write
CREATE POLICY app_settings_insert ON public.app_settings
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.get_user_role()) = 'admin');

CREATE POLICY app_settings_update ON public.app_settings
  FOR UPDATE TO authenticated
  USING ((SELECT public.get_user_role()) = 'admin');

CREATE POLICY app_settings_delete ON public.app_settings
  FOR DELETE TO authenticated
  USING ((SELECT public.get_user_role()) = 'admin');

-- audit_logs: all authenticated can read and insert (append-only, no update/delete)
CREATE POLICY audit_logs_select ON public.audit_logs
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY audit_logs_insert ON public.audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- notifications: users can only access their own
CREATE POLICY notifications_select ON public.notifications
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY notifications_update ON public.notifications
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY notifications_delete ON public.notifications
  FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- ── Grants ──────────────────────────────────────────────────────────────────

-- authenticated role
GRANT SELECT, INSERT, UPDATE ON public.user_profiles TO authenticated;
GRANT SELECT ON public.app_settings TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.app_settings TO authenticated;
-- audit_logs: read-only for authenticated; writes go through service_role only
GRANT SELECT ON public.audit_logs TO authenticated;
GRANT SELECT, UPDATE, DELETE ON public.notifications TO authenticated;

-- Defense-in-depth: revoke direct writes on append-only tables
-- (only service_role / SECURITY DEFINER functions should insert)
REVOKE INSERT ON public.notifications FROM authenticated;
REVOKE INSERT ON public.audit_logs FROM authenticated;

-- service_role (bypasses RLS, used by server actions)
GRANT ALL ON public.user_profiles TO service_role;
GRANT ALL ON public.app_settings TO service_role;
GRANT ALL ON public.audit_logs TO service_role;
GRANT ALL ON public.notifications TO service_role;

-- ── Realtime ────────────────────────────────────────────────────────────────

ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
