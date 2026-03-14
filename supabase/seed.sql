-- ============================================================================
-- Seed entry point
-- Runs after migrations on `supabase db reset`.
--
-- Layer 1: Production data  (supabase/data/)    — always needed
-- Layer 2: Demo fixtures    (supabase/fixtures/) — dev/staging only
--
-- To run only production data in a real environment, execute:
--   psql -f supabase/data/001_app_settings.sql
--   psql -f supabase/data/002_pipelines.sql
--   psql -f supabase/data/003_indexation_indices.sql
-- ============================================================================

-- ── Layer 1: Production data ────────────────────────────────────────────────
\ir data/001_app_settings.sql
\ir data/002_pipelines.sql
\ir data/003_indexation_indices.sql

-- ── Layer 2: Demo fixtures (remove for production) ──────────────────────────
\ir fixtures/001_users.sql
\ir fixtures/002_crm_data.sql
\ir fixtures/003_sales.sql
