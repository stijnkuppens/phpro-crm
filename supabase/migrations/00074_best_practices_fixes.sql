-- ============================================================================
-- Migration: Best practices audit fixes
-- 1. Fix get_user_role() RLS performance (CRITICAL)
-- 2. Add trigram indexes for ILIKE search
-- 3. Add unique constraint on pipeline_stages for idempotent seeding
-- 4. Add get_open_deal_value() RPC for dashboard
-- ============================================================================

-- ── 1. Fix get_user_role() — wrap auth.uid() in (select ...) ────────────────
-- This forces Postgres to evaluate auth.uid() once per query instead of per row.
-- All ~229 RLS policy calls that use get_user_role() benefit automatically.
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text AS $$
  SELECT role FROM public.user_profiles WHERE id = (select auth.uid())
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- ── 2. Trigram indexes for ILIKE search ─────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_accounts_name_trgm ON accounts USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_accounts_domain_trgm ON accounts USING gin (domain gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_contacts_first_name_trgm ON contacts USING gin (first_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_contacts_last_name_trgm ON contacts USING gin (last_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_contacts_email_trgm ON contacts USING gin (email gin_trgm_ops);

-- ── 3. Unique constraint on pipeline_stages for idempotent seeding ──────────
ALTER TABLE pipeline_stages
  ADD CONSTRAINT pipeline_stages_pipeline_name_unique UNIQUE (pipeline_id, name);

-- ── 4. Dashboard RPC: compute open deal value in Postgres ───────────────────
CREATE OR REPLACE FUNCTION public.get_open_deal_value()
RETURNS numeric LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT COALESCE(SUM(amount * probability::numeric / 100), 0)
  FROM deals WHERE closed_at IS NULL;
$$;

GRANT EXECUTE ON FUNCTION public.get_open_deal_value() TO authenticated;
