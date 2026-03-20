---
phase: 01-foundation-reference-data
plan: 01
subsystem: database
tags: [supabase, postgres, rls, fk-migration, reference-data, lookup-tables]

requires:
  - phase: none
    provides: greenfield database tables
provides:
  - 13 ref_* lookup tables with RLS, GRANT, triggers, realtime
  - FK-based junction tables replacing freetext string columns
  - Production seed data for all reference tables
  - account_cc_services junction table for CC service assignments
affects: [01-foundation-reference-data, 02-accounts-contacts, 03-sales-pipeline, 04-contracts-indexation, 05-consultants]

tech-stack:
  added: []
  patterns: [ref_* table convention with name/sort_order/is_active, ON CONFLICT idempotent seeding, self-contained FK migration with inline data seeding]

key-files:
  created:
    - supabase/migrations/00054_reference_tables.sql
    - supabase/migrations/00055_junction_table_fk_migration.sql
    - supabase/data/004_reference_data.sql
  modified:
    - supabase/seed.sql
    - supabase/fixtures/002_crm_data.sql

key-decisions:
  - "Merged CONSULTANT_ROLES and TARIEF_ROLLEN into single ref_consultant_roles table (identical 12 roles)"
  - "FK migration seeds ref data inline before constraints, making migration self-contained"
  - "Orphan fixture values (PIMCore, Microsoft Dynamics) auto-inserted into ref_technologies during migration"

patterns-established:
  - "ref_* table pattern: id uuid, name text UNIQUE, sort_order int, is_active bool, timestamps, RLS (select all, admin CUD), GRANT, realtime"
  - "Self-contained FK migration: seed data inline -> add column -> populate -> set NOT NULL -> drop old column"

requirements-completed: [FOUND-01]

duration: 4min
completed: 2026-03-20
---

# Phase 1 Plan 1: Reference Tables & FK Migration Summary

**13 ref_* lookup tables with RLS/GRANT/realtime, production seed data, and 5 junction tables migrated from freetext to FK references**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-20T13:27:41Z
- **Completed:** 2026-03-20T13:32:08Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Created 13 reference lookup tables covering all hardcoded constants from demo_crm (competence centers, services, roles, technologies, hosting, languages, contact roles, hobbies, SLA tools, collaboration types, stop reasons)
- Migrated 5 junction tables from freetext strings to proper FK references (account_tech_stacks, account_samenwerkingsvormen, account_hosting, account_competence_centers, account_services)
- Created new account_cc_services junction table to replace text[] column with proper many-to-many
- Updated fixture data to use FK subselects; db:reset runs clean with zero errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Create 13 reference tables migration + seed reference data** - `18e268d` (feat)
2. **Task 2: Migrate junction tables from freetext to FK references** - `afebbcd` (feat)

## Files Created/Modified
- `supabase/migrations/00054_reference_tables.sql` - 13 ref_* tables with RLS, triggers, GRANT, realtime
- `supabase/migrations/00055_junction_table_fk_migration.sql` - Self-contained FK migration for 5 junction tables + new account_cc_services table
- `supabase/data/004_reference_data.sql` - Production seed data for all 13 reference tables
- `supabase/seed.sql` - Added 004_reference_data.sql to Layer 1
- `supabase/fixtures/002_crm_data.sql` - Updated to use FK subselects instead of freetext values

## Decisions Made
- Merged CONSULTANT_ROLES and TARIEF_ROLLEN into a single ref_consultant_roles table since both arrays contain the same 12 roles
- FK migration seeds reference data inline (before adding constraints) to be self-contained -- migrations run before seed.sql
- Fixture orphan values (PIMCore, Microsoft Dynamics) are auto-inserted into ref_technologies via orphan-insert pattern

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Updated fixture file for FK compatibility**
- **Found during:** Task 2 (Junction table FK migration)
- **Issue:** Fixture 002_crm_data.sql uses freetext values (technology, type, provider, environment) that no longer exist after migration drops those columns
- **Fix:** Updated all fixture INSERT statements to use FK subselects (e.g., `(SELECT id FROM ref_technologies WHERE name = 'SAP')`)
- **Files modified:** supabase/fixtures/002_crm_data.sql
- **Verification:** `task db:reset` runs clean with zero errors
- **Committed in:** afebbcd (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 missing critical)
**Impact on plan:** Essential for db:reset to work. Fixture update was implied by the migration but not explicitly listed in plan files.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All 13 reference tables populated and ready for admin UI (Plan 01-03)
- Junction tables use proper FK references; queries/actions/components need updating (Plan 01-02)
- db:reset produces a fully functional database with reference data

---
*Phase: 01-foundation-reference-data*
*Completed: 2026-03-20*
