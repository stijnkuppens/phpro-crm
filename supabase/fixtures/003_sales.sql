-- ============================================================================
-- Fixtures: Sales data (deals, activities, tasks)
-- ============================================================================

-- ── Deals ───────────────────────────────────────────────────────────────────
INSERT INTO deals (id, title, account_id, pipeline_id, stage_id, amount, close_date, probability, owner_id, description, lead_source, origin, cronos_cc, cronos_contact, cronos_email)
SELECT
  'd0000000-0000-0000-0000-000000000001'::uuid,
  'TechVision Platform Upgrade',
  'a0000000-0000-0000-0000-000000000001'::uuid,
  p.id,
  ps.id,
  125000, '2026-03-31', 60,
  (SELECT id FROM user_profiles WHERE full_name = 'Sales Manager'),
  'Upgrade van het bestaande e-commerce platform naar Magento 2.4.',
  'Referral', 'rechtstreeks', '', '', ''
FROM pipelines p
JOIN pipeline_stages ps ON ps.pipeline_id = p.id AND ps.name = 'Voorstel'
WHERE p.name = 'Projecten'
ON CONFLICT DO NOTHING;

INSERT INTO deals (id, title, account_id, pipeline_id, stage_id, amount, close_date, probability, owner_id, description, lead_source, origin, cronos_cc, cronos_contact, cronos_email)
SELECT
  'd0000000-0000-0000-0000-000000000002'::uuid,
  'GreenLogistics TMS Implementatie',
  'a0000000-0000-0000-0000-000000000002'::uuid,
  p.id,
  ps.id,
  85000, '2026-06-30', 25,
  (SELECT id FROM user_profiles WHERE full_name = 'Admin User'),
  'Transport Management System implementatie.',
  'Partner', 'rechtstreeks', '', '', ''
FROM pipelines p
JOIN pipeline_stages ps ON ps.pipeline_id = p.id AND ps.name = 'Meeting'
WHERE p.name = 'Projecten'
ON CONFLICT DO NOTHING;

INSERT INTO deals (id, title, account_id, pipeline_id, stage_id, amount, close_date, probability, owner_id, description, lead_source, origin, cronos_cc, cronos_contact, cronos_email)
SELECT
  'd0000000-0000-0000-0000-000000000005'::uuid,
  'TechVision Security Module',
  'a0000000-0000-0000-0000-000000000001'::uuid,
  p.id,
  ps.id,
  55000, '2026-02-28', 80,
  (SELECT id FROM user_profiles WHERE full_name = 'Sales Manager'),
  'Implementatie security module.',
  'E-mail', 'rechtstreeks', '', '', ''
FROM pipelines p
JOIN pipeline_stages ps ON ps.pipeline_id = p.id AND ps.name = 'Onderhandeling'
WHERE p.name = 'Projecten'
ON CONFLICT DO NOTHING;

INSERT INTO deals (id, title, account_id, pipeline_id, stage_id, amount, close_date, probability, owner_id, description, lead_source, origin, cronos_cc, cronos_contact, cronos_email)
SELECT
  'd0000000-0000-0000-0000-000000000003'::uuid,
  'Dev Senior plaatsing bij MediCare Plus',
  'a0000000-0000-0000-0000-000000000003'::uuid,
  p.id,
  ps.id,
  9800, '2026-04-15', 25,
  (SELECT id FROM user_profiles WHERE full_name = 'Admin User'),
  '',
  '', 'cronos', 'Induxx', 'Peter Maes', 'peter@induxx.be'
FROM pipelines p
JOIN pipeline_stages ps ON ps.pipeline_id = p.id AND ps.name = 'CV/Info'
WHERE p.name = 'Consultancy Profielen'
ON CONFLICT DO NOTHING;

INSERT INTO deals (id, title, account_id, pipeline_id, stage_id, amount, close_date, probability, owner_id, description, lead_source, origin, cronos_cc, cronos_contact, cronos_email)
SELECT
  'd0000000-0000-0000-0000-000000000006'::uuid,
  'Analist plaatsing bij TechVision',
  'a0000000-0000-0000-0000-000000000001'::uuid,
  p.id,
  ps.id,
  8640, '2026-03-01', 50,
  (SELECT id FROM user_profiles WHERE full_name = 'Sales Manager'),
  '',
  '', 'rechtstreeks', '', '', ''
FROM pipelines p
JOIN pipeline_stages ps ON ps.pipeline_id = p.id AND ps.name = 'Intake'
WHERE p.name = 'Consultancy Profielen'
ON CONFLICT DO NOTHING;

-- ── Activities ──────────────────────────────────────────────────────────────
INSERT INTO activities (id, type, subject, date, duration_minutes, account_id, deal_id, owner_id, notes, is_done)
SELECT
  'ac000000-0000-0000-0000-000000000001'::uuid,
  'Meeting', 'Discovery call TechVision', '2025-10-15T10:00:00Z', 45,
  'a0000000-0000-0000-0000-000000000001'::uuid,
  'd0000000-0000-0000-0000-000000000001'::uuid,
  up.id,
  '[{"type":"paragraph","children":[{"text":"Eerste kennismaking. Budget bevestigd."}]}]'::jsonb,
  true
FROM user_profiles up WHERE up.full_name = 'Sales Manager'
ON CONFLICT DO NOTHING;

INSERT INTO activities (id, type, subject, date, duration_minutes, account_id, deal_id, owner_id, notes, is_done)
SELECT
  'ac000000-0000-0000-0000-000000000002'::uuid,
  'Demo', 'Platform demo voor TechVision', '2025-11-20T14:00:00Z', 90,
  'a0000000-0000-0000-0000-000000000001'::uuid,
  'd0000000-0000-0000-0000-000000000001'::uuid,
  up.id,
  '[{"type":"paragraph","children":[{"text":"Demo van het nieuwe platform gegeven. Positieve reactie van het team."}]}]'::jsonb,
  true
FROM user_profiles up WHERE up.full_name = 'Sales Manager'
ON CONFLICT DO NOTHING;

INSERT INTO activities (id, type, subject, date, duration_minutes, account_id, deal_id, owner_id, notes, is_done)
SELECT
  'ac000000-0000-0000-0000-000000000003'::uuid,
  'Call', 'Follow-up GreenLogistics', '2026-01-15T11:00:00Z', 20,
  'a0000000-0000-0000-0000-000000000002'::uuid,
  'd0000000-0000-0000-0000-000000000002'::uuid,
  up.id,
  null,
  true
FROM user_profiles up WHERE up.full_name = 'Admin User'
ON CONFLICT DO NOTHING;

INSERT INTO activities (id, type, subject, date, duration_minutes, account_id, deal_id, owner_id, notes, is_done)
SELECT
  'ac000000-0000-0000-0000-000000000004'::uuid,
  'Meeting', 'Voorstel bespreken TechVision', '2026-04-10T10:00:00Z', 60,
  'a0000000-0000-0000-0000-000000000001'::uuid,
  'd0000000-0000-0000-0000-000000000001'::uuid,
  up.id,
  null,
  false
FROM user_profiles up WHERE up.full_name = 'Sales Manager'
ON CONFLICT DO NOTHING;

-- ── Tasks ───────────────────────────────────────────────────────────────────
INSERT INTO tasks (id, title, due_date, priority, status, account_id, deal_id, assigned_to)
SELECT
  'da000000-0000-0000-0000-000000000001'::uuid,
  'Stuur aangepaste offerte TechVision', '2026-02-18', 'High', 'Open',
  'a0000000-0000-0000-0000-000000000001'::uuid,
  'd0000000-0000-0000-0000-000000000001'::uuid,
  up.id
FROM user_profiles up WHERE up.full_name = 'Sales Manager'
ON CONFLICT DO NOTHING;

INSERT INTO tasks (id, title, due_date, priority, status, account_id, deal_id, assigned_to)
SELECT
  'da000000-0000-0000-0000-000000000002'::uuid,
  'Follow-up call Dirk Van Damme', '2026-02-20', 'Medium', 'Open',
  'a0000000-0000-0000-0000-000000000002'::uuid,
  null,
  up.id
FROM user_profiles up WHERE up.full_name = 'Admin User'
ON CONFLICT DO NOTHING;
