-- ── Users ────────────────────────────────────────
-- Idempotent: skips if users already exist
DO $$
DECLARE
  admin_id   uuid := gen_random_uuid();
  editor_id  uuid := gen_random_uuid();
  viewer_id  uuid := gen_random_uuid();
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

  -- Editor user
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_user_meta_data,
    created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    editor_id,
    'authenticated',
    'authenticated',
    'editor@example.com',
    crypt('editor123456', gen_salt('bf')),
    now(),
    '{"full_name": "Editor User"}'::jsonb,
    now(),
    now(),
    '', '', '', ''
  );
  UPDATE public.user_profiles SET role = 'editor', full_name = 'Editor User' WHERE id = editor_id;

  -- Viewer user
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_user_meta_data,
    created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    viewer_id,
    'authenticated',
    'authenticated',
    'viewer@example.com',
    crypt('viewer123456', gen_salt('bf')),
    now(),
    '{"full_name": "Viewer User"}'::jsonb,
    now(),
    now(),
    '', '', '', ''
  );
  UPDATE public.user_profiles SET role = 'viewer', full_name = 'Viewer User' WHERE id = viewer_id;

END $$;

-- ── Contacts ─────────────────────────────────────
INSERT INTO public.contacts (name, email, phone, company, notes) VALUES
  ('Alice Johnson',    'alice.johnson@acmecorp.com',      '+1-555-0101', 'Acme Corp',          'Key account. Prefers email contact.'),
  ('Bob Martinez',     'bob.martinez@globex.io',          '+1-555-0102', 'Globex',              'Interested in enterprise plan.'),
  ('Carol White',      'carol.white@initech.com',         '+1-555-0103', 'Initech',             'Referred by Alice Johnson.'),
  ('David Lee',        'david.lee@umbrellacorp.net',      '+1-555-0104', 'Umbrella Corp',       'Decision maker. Call after 2pm.'),
  ('Eva Brown',        'eva.brown@massive-dynamic.com',   '+1-555-0105', 'Massive Dynamic',     'Requested product demo.'),
  ('Frank Garcia',     'frank.garcia@soylent.co',         '+1-555-0106', 'Soylent Corp',        'Budget approved for Q2.'),
  ('Grace Kim',        'grace.kim@bluth.com',             '+1-555-0107', 'Bluth Company',       'New contact from trade show.'),
  ('Henry Wilson',     'henry.wilson@wernham-hogg.co.uk', '+44-555-0108', 'Wernham Hogg',       'UK market lead.'),
  ('Isabella Davis',   'isabella.davis@dunder-mifflin.com','+1-555-0109', 'Dunder Mifflin',    'Paper supplier inquiry.'),
  ('James Taylor',     'james.taylor@sterling-cooper.com','+1-555-0110', 'Sterling Cooper',    'Creative director. Very responsive.'),
  ('Karen Anderson',   'karen.anderson@nakatomi.jp',      '+81-555-0111', 'Nakatomi Corp',      'Tokyo office contact.'),
  ('Liam Thomas',      'liam.thomas@vandelay.com',        '+1-555-0112', 'Vandelay Industries', 'Import/export specialist.'),
  ('Mia Jackson',      'mia.jackson@oscorp.net',          '+1-555-0113', 'Oscorp',              'R&D department lead.'),
  ('Noah Harris',      'noah.harris@wayne-enterprises.com','+1-555-0114', 'Wayne Enterprises',  'Philanthropy division.'),
  ('Olivia Martin',    'olivia.martin@stark-industries.io','+1-555-0115', 'Stark Industries',   'Tech partnerships.'),
  ('Paul Robinson',    'paul.robinson@cyberdyne.com',     '+1-555-0116', 'Cyberdyne Systems',   'Future tech division.'),
  ('Quinn Clark',      'quinn.clark@aperture-science.com','+1-555-0117', 'Aperture Science',   'Lab equipment procurement.'),
  ('Rachel Lewis',     'rachel.lewis@initech.com',        '+1-555-0118', 'Initech',             'Second contact at Initech.'),
  ('Sam Walker',       'sam.walker@pied-piper.com',       '+1-555-0119', 'Pied Piper',          'Startup founder. High potential.'),
  ('Tina Hall',        'tina.hall@hooli.com',             '+1-555-0120', 'Hooli',               'Enterprise sales rep.')
ON CONFLICT DO NOTHING;

-- ── App Settings ─────────────────────────────────
INSERT INTO public.app_settings (key, value) VALUES
  ('app_name', '{"value": "25Carat App"}'::jsonb),
  ('logo_url',  '{"value": "https://example.com/logo.png"}'::jsonb)
ON CONFLICT (key) DO NOTHING;
