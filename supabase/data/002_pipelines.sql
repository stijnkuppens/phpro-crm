-- ============================================================================
-- Production Data: Pipelines and their stages
-- These define the sales process structure — required for the app to function.
-- ============================================================================

INSERT INTO pipelines (id, name, type, sort_order) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Projecten', 'projecten', 1),
  ('00000000-0000-0000-0000-000000000002', 'RFP', 'rfp', 2),
  ('00000000-0000-0000-0000-000000000003', 'Consultancy Profielen', 'consultancy', 3)
ON CONFLICT (id) DO NOTHING;

-- Projecten stages
INSERT INTO pipeline_stages (pipeline_id, name, sort_order, probability, color, is_closed, is_won, is_longterm) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Lead',           1,  10, '#6366f1', false, false, false),
  ('00000000-0000-0000-0000-000000000001', 'Meeting',        2,  25, '#8b5cf6', false, false, false),
  ('00000000-0000-0000-0000-000000000001', 'Demo',           3,  40, '#a855f7', false, false, false),
  ('00000000-0000-0000-0000-000000000001', 'Voorstel',       4,  60, '#d946ef', false, false, false),
  ('00000000-0000-0000-0000-000000000001', 'Onderhandeling', 5,  80, '#ec4899', false, false, false),
  ('00000000-0000-0000-0000-000000000001', 'Gewonnen',       6, 100, '#22c55e', true,  true,  false),
  ('00000000-0000-0000-0000-000000000001', 'Verloren',       7,   0, '#ef4444', true,  false, false),
  ('00000000-0000-0000-0000-000000000001', 'Longterm',       8,   0, '#f59e0b', true,  false, true)
ON CONFLICT (pipeline_id, name) DO NOTHING;

-- RFP stages
INSERT INTO pipeline_stages (pipeline_id, name, sort_order, probability, color, is_closed, is_won, is_longterm) VALUES
  ('00000000-0000-0000-0000-000000000002', 'Ontvangen',        1,  10, '#06b6d4', false, false, false),
  ('00000000-0000-0000-0000-000000000002', 'Kandidaatstelling', 2, 25, '#0891b2', false, false, false),
  ('00000000-0000-0000-0000-000000000002', 'RFI',              3,  40, '#0e7490', false, false, false),
  ('00000000-0000-0000-0000-000000000002', 'RFP',              4,  60, '#0c4a6e', false, false, false),
  ('00000000-0000-0000-0000-000000000002', 'Onderhandeling',   5,  80, '#1e3a5f', false, false, false),
  ('00000000-0000-0000-0000-000000000002', 'Gewonnen',         6, 100, '#22c55e', true,  true,  false),
  ('00000000-0000-0000-0000-000000000002', 'Verloren',         7,   0, '#ef4444', true,  false, false),
  ('00000000-0000-0000-0000-000000000002', 'Longterm',         8,   0, '#f59e0b', true,  false, true)
ON CONFLICT (pipeline_id, name) DO NOTHING;

-- Consultancy Profielen stages
INSERT INTO pipeline_stages (pipeline_id, name, sort_order, probability, color, is_closed, is_won, is_longterm) VALUES
  ('00000000-0000-0000-0000-000000000003', 'Lead',             1,  10, '#14b8a6', false, false, false),
  ('00000000-0000-0000-0000-000000000003', 'CV/Info',          2,  25, '#0d9488', false, false, false),
  ('00000000-0000-0000-0000-000000000003', 'Intake',           3,  50, '#0f766e', false, false, false),
  ('00000000-0000-0000-0000-000000000003', 'Contract',         4,  75, '#115e59', false, false, false),
  ('00000000-0000-0000-0000-000000000003', 'Geplaatst',        5, 100, '#22c55e', true,  true,  false),
  ('00000000-0000-0000-0000-000000000003', 'Niet weerhouden',  6,   0, '#ef4444', true,  false, false)
ON CONFLICT (pipeline_id, name) DO NOTHING;
