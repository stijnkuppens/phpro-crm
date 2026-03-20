# Phase 1: Foundation & Reference Data - Context

**Gathered:** 2026-03-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Seed all reference data into the database as proper lookup tables, migrate existing text[] columns to FK relationships, install additive libraries (recharts, react-number-format, nuqs), expand fixture data beyond the demo scope, and build admin UI for reference table management. This phase unblocks every subsequent phase by making reference data queryable and relationally correct.

</domain>

<decisions>
## Implementation Decisions

### Reference Data Modeling
- ALL 13 reference data sets from `demo_crm/src/constants.ts` must become proper Supabase tables — no constants-in-code approach
- Entity-like data (CC names, hosting providers, consultant roles, tariff roles) AND pure suggestion lists (hobbies, SLA tools, tech suggestions) all get DB tables
- Tables should be seeded via `supabase/data/` files (production data, runs in every environment)
- An admin UI for managing reference tables should be built in this phase — not deferred to Phase 10

### Schema Migration: text[] → FK Relationships
- Existing text array columns on the accounts table (e.g., `competence_centers text[]`) must be migrated to proper FK relationships with junction tables
- This is a significant schema change that affects existing fixture data and possibly existing queries
- Do this in Phase 1 alongside the reference table creation — one clean migration, not spread across phases
- All existing queries, actions, and components that read/write these columns will need updating

### Fixture Data
- Expand BEYOND the demo — aim for 10+ accounts, 20+ contacts for more realistic testing (demo only has 3 accounts, 4 contacts)
- Update ALL existing fixture files to reference the new FK-based reference tables correctly
- Ensure all fixtures load without FK constraint errors after the migration

### Library Installation
- Add `react-is` override to `package.json` for recharts React 19 compatibility
- Add `NuqsAdapter` to root layout — no concerns about modifying root layout
- Use `npx shadcn@latest add chart` (shadcn chart component wrapping recharts) — consistent with existing shadcn/ui usage
- Install `react-number-format` for currency input fields

### Claude's Discretion
- Exact table schema design for each reference table (columns, constraints, indexes)
- Junction table naming conventions
- Migration ordering to avoid FK constraint issues
- How to handle the text[] → FK data migration (data transformation SQL)
- NuqsAdapter placement in the provider hierarchy

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Reference Data Source
- `demo_crm/src/constants.ts` — All 13 reference data sets with exact values (CC_NAMEN, TARIEF_ROLLEN, SLA_TOOL_SUGGESTIONS, HOSTING_PROVIDERS, HOSTING_OMGEVINGEN, TECH_SUGGESTIONS, TALEN_LIJST, TAAL_NIVEAUS, CC_SERVICES, CONTACT_ROLES, HOBBY_SUGGESTIONS, VERDELING_OPTIES, SAMENWERKINGSVORMEN, STOPZET_REDENEN, CONSULTANT_ROLES, AGORIA_INDICES)
- `demo_crm/src/seed.ts` — Demo seed data for all entities

### Existing Data Layer
- `supabase/data/002_pipelines.sql` — Pipelines already seeded (do not duplicate)
- `supabase/data/003_indexation_indices.sql` — Agoria indices already seeded (do not duplicate)
- `supabase/migrations/00011_accounts.sql` — Current accounts schema with text[] columns to migrate
- `supabase/migrations/00053_add_missing_fk_constraints.sql` — Evidence of prior FK retroactive fix

### Architecture Rules
- `CLAUDE.md` §Database — Three-layer data strategy, GRANT requirements, migration rules
- `.planning/codebase/CONVENTIONS.md` — Existing code patterns
- `.planning/research/PITFALLS.md` — FK constraint warnings, text[] → FK migration risks

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `supabase/data/` directory pattern already established with idempotent `ON CONFLICT DO NOTHING` inserts
- Existing junction tables for account relations: `account_tech_stacks`, `account_manual_services`, `account_samenwerkingsvormen`, `account_hosting`, `account_competence_centers`, `account_services`
- `useEntity` hook supports any table name for generic CRUD

### Established Patterns
- Production data in `supabase/data/` numbered files, fixtures in `supabase/fixtures/`
- Migrations use sequential numbering `00XXX_description.sql`
- All tables require `ENABLE ROW LEVEL SECURITY`, `CREATE POLICY`, `GRANT` statements

### Integration Points
- Root layout (`src/app/layout.tsx`) — needs `NuqsAdapter` provider
- `package.json` — needs `react-is` override for recharts, new dependencies
- All account relation components will need updating after text[] → FK migration
- Existing fixture files (001–006) need FK reference updates

</code_context>

<specifics>
## Specific Ideas

- Fixture data should feel realistic — use Belgian company names, real-world tech stacks, varied account types
- Admin UI for reference tables should be simple — basic CRUD, not over-engineered
- All 13 data sets from constants.ts must be represented in the database; no data set should be left as a hardcoded constant

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-foundation-reference-data*
*Context gathered: 2026-03-20*
