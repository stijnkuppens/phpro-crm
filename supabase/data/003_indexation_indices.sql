-- ============================================================================
-- Production Data: Indexation reference indices (e.g. Agoria)
-- ============================================================================

INSERT INTO indexation_indices (name, value) VALUES
  ('Agoria', 3.1),
  ('Agoria Digital', 2.8)
ON CONFLICT (name) DO NOTHING;
