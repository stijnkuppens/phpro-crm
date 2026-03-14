-- ── Users ────────────────────────────────────────
-- Idempotent: skips if users already exist
DO $$
DECLARE
  admin_id      uuid := gen_random_uuid();
  manager_id    uuid := gen_random_uuid();
  marketing_id  uuid := gen_random_uuid();
BEGIN

  -- Skip if already seeded
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@example.com') THEN
    RAISE NOTICE 'Seed users already exist — skipping.';
    RETURN;
  END IF;

  -- Admin user
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_user_meta_data,
    created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    admin_id,
    'authenticated',
    'authenticated',
    'admin@example.com',
    crypt('admin123456', gen_salt('bf')),
    now(),
    '{"full_name": "Admin User"}'::jsonb,
    now(),
    now(),
    '', '', '', ''
  );
  UPDATE public.user_profiles SET role = 'admin', full_name = 'Admin User' WHERE id = admin_id;

  -- Sales Manager user
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_user_meta_data,
    created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    manager_id,
    'authenticated',
    'authenticated',
    'manager@example.com',
    crypt('manager123456', gen_salt('bf')),
    now(),
    '{"full_name": "Sales Manager"}'::jsonb,
    now(),
    now(),
    '', '', '', ''
  );
  UPDATE public.user_profiles SET role = 'sales_manager', full_name = 'Sales Manager' WHERE id = manager_id;

  -- Marketing user
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_user_meta_data,
    created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    marketing_id,
    'authenticated',
    'authenticated',
    'marketing@example.com',
    crypt('marketing123456', gen_salt('bf')),
    now(),
    '{"full_name": "Marketing User"}'::jsonb,
    now(),
    now(),
    '', '', '', ''
  );
  UPDATE public.user_profiles SET role = 'marketing', full_name = 'Marketing User' WHERE id = marketing_id;

END $$;

-- ── App Settings ─────────────────────────────────
INSERT INTO public.app_settings (key, value) VALUES
  ('app_name', '{"value": "25Carat App"}'::jsonb),
  ('logo_url',  '{"value": "https://example.com/logo.png"}'::jsonb)
ON CONFLICT (key) DO NOTHING;
