-- ============================================================================
-- Demo Fixture: Test users with known passwords
-- DO NOT run in production.
-- ============================================================================

DO $$
DECLARE
  admin_id      uuid := gen_random_uuid();
  manager_id    uuid := gen_random_uuid();
  marketing_id  uuid := gen_random_uuid();
BEGIN

  -- Skip if already seeded
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@example.com') THEN
    RAISE NOTICE 'Demo users already exist — skipping.';
    RETURN;
  END IF;

  -- Admin user (password: admin123456)
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_user_meta_data,
    created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    admin_id, 'authenticated', 'authenticated',
    'admin@example.com', crypt('admin123456', gen_salt('bf')),
    now(), '{"full_name": "Admin User"}'::jsonb,
    now(), now(), '', '', '', ''
  );
  INSERT INTO public.user_profiles (id, full_name, role)
  VALUES (admin_id, 'Admin User', 'admin')
  ON CONFLICT (id) DO UPDATE SET role = 'admin', full_name = 'Admin User';

  -- Sales Manager (password: manager123456)
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_user_meta_data,
    created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    manager_id, 'authenticated', 'authenticated',
    'manager@example.com', crypt('manager123456', gen_salt('bf')),
    now(), '{"full_name": "Sales Manager"}'::jsonb,
    now(), now(), '', '', '', ''
  );
  INSERT INTO public.user_profiles (id, full_name, role)
  VALUES (manager_id, 'Sales Manager', 'sales_manager')
  ON CONFLICT (id) DO UPDATE SET role = 'sales_manager', full_name = 'Sales Manager';

  -- Marketing user (password: marketing123456)
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_user_meta_data,
    created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    marketing_id, 'authenticated', 'authenticated',
    'marketing@example.com', crypt('marketing123456', gen_salt('bf')),
    now(), '{"full_name": "Marketing User"}'::jsonb,
    now(), now(), '', '', '', ''
  );
  INSERT INTO public.user_profiles (id, full_name, role)
  VALUES (marketing_id, 'Marketing User', 'marketing')
  ON CONFLICT (id) DO UPDATE SET role = 'marketing', full_name = 'Marketing User';

END $$;
