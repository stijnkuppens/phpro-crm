/*
  Migration: JWT role claims

  Syncs user_profiles.role into auth.users.raw_app_meta_data so the role is
  embedded in the JWT token. This eliminates a per-request DB lookup for role
  checks — the get_user_role() function (from 00001_foundation) reads the role
  from JWT first, falling back to the DB only when the JWT claim is missing.

  Components:
  1. sync_role_to_jwt() — trigger function (SECURITY DEFINER to write auth.users)
  2. on_role_change_sync_jwt — trigger on user_profiles AFTER INSERT OR UPDATE OF role
  3. Backfill — updates existing auth.users metadata from current user_profiles
*/

-- ── Trigger function ────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.sync_role_to_jwt()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE auth.users
  SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', NEW.role)
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$;

-- ── Trigger ─────────────────────────────────────────────────────────────────

DROP TRIGGER IF EXISTS on_role_change_sync_jwt ON user_profiles;
CREATE TRIGGER on_role_change_sync_jwt
  AFTER INSERT OR UPDATE OF role ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_role_to_jwt();

-- ── Backfill existing roles ─────────────────────────────────────────────────

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT id, role FROM user_profiles WHERE role IS NOT NULL LOOP
    UPDATE auth.users
    SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', r.role)
    WHERE id = r.id;
  END LOOP;
END;
$$;
