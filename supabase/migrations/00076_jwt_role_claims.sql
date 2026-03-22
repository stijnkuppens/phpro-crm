-- Sync user role from user_profiles to auth.users.raw_app_meta_data.
-- This makes the role available in the JWT token, eliminating DB queries
-- in middleware and server actions for permission checks.

CREATE OR REPLACE FUNCTION sync_role_to_jwt()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE auth.users
  SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', NEW.role)
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_role_change_sync_jwt ON user_profiles;
CREATE TRIGGER on_role_change_sync_jwt
  AFTER INSERT OR UPDATE OF role ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_role_to_jwt();

-- Backfill existing roles
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
