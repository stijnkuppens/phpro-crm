---
phase: 01-foundation-reference-data
plan: 02
subsystem: database, ui
tags: [supabase, fixtures, FK-migration, reference-data, accounts]

requires:
  - phase: 01-foundation-reference-data plan 01
    provides: FK junction table schema (ref_* tables, migration 00055)
provides:
  - Updated fixture data with FK subqueries for all junction tables (11 accounts, 22 contacts)
  - Application code (types, queries, actions, components) working with FK-based junction tables
  - Reference data query helper for form dropdowns (get-reference-options.ts)
  - Database type definitions for all 13 ref_* tables and account_cc_services
affects: [accounts, contacts, reference-data, consultants]

tech-stack:
  added: []
  patterns:
    - "Supabase nested select joins through ref_* tables for display names"
    - "ReferenceOption type ({ id, name }) as standard for dropdown/suggestion data"
    - "AccountReferenceData prop pattern for server-fetched form suggestions"

key-files:
  created:
    - src/features/reference-data/queries/get-reference-options.ts
  modified:
    - supabase/fixtures/002_crm_data.sql
    - src/types/database.ts
    - src/features/accounts/types.ts
    - src/features/accounts/queries/get-account.ts
    - src/features/accounts/actions/manage-account-relations.ts
    - src/features/accounts/components/account-overview-tab.tsx
    - src/features/accounts/components/account-form.tsx
    - src/app/admin/accounts/new/page.tsx

key-decisions:
  - "Replaced hardcoded constant arrays in account-form.tsx with referenceData prop pattern — form gets options from server components"
  - "Renamed syncAccountStringRelation to syncAccountFKRelation to reflect UUID-based FK sync"
  - "Added WithRef type variants (AccountTechStackWithRef, etc.) instead of modifying base Row types"

patterns-established:
  - "AccountReferenceData: server component fetches ref data via getReferenceOptions, passes as prop to client form"
  - "Supabase nested select: tech_stacks:account_tech_stacks(id, technology:ref_technologies(id, name))"

requirements-completed: [FOUND-02]

duration: 10min
completed: 2026-03-20
---

# Phase 1 Plan 2: FK Application Code + Expanded Fixtures Summary

**Updated all fixtures to use FK subqueries (11 accounts, 22 contacts), and migrated all account app code (types, queries, actions, components) to work with FK-based junction tables**

## Performance

- **Duration:** 10 min
- **Started:** 2026-03-20T13:34:34Z
- **Completed:** 2026-03-20T13:45:28Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- Expanded demo fixtures from 3 accounts/4 contacts to 11 accounts/22 contacts with diverse data
- All junction table INSERTs use FK subqueries (SELECT id FROM ref_* WHERE name = ...)
- Application types, queries, actions, and components all compile and work with nested FK joins
- Hardcoded constant arrays in account form replaced with database-fetched reference data

## Task Commits

Each task was committed atomically:

1. **Task 1: Update fixture files for FK references and expand demo data** - `2348173` (feat)
2. **Task 2: Update application code for FK-based relations** - `8a9466f` (feat)

## Files Created/Modified
- `supabase/fixtures/002_crm_data.sql` - Expanded demo data with FK subqueries for all junction tables
- `src/types/database.ts` - Updated junction table types (FK ID columns), added ref_* table types + account_cc_services
- `src/features/accounts/types.ts` - Added WithRef types for FK-joined relations, updated form schemas
- `src/features/accounts/queries/get-account.ts` - Nested select joins through ref_* tables
- `src/features/accounts/actions/manage-account-relations.ts` - syncAccountFKRelation, account_cc_services support
- `src/features/accounts/components/account-overview-tab.tsx` - Nested .name property access
- `src/features/accounts/components/account-form.tsx` - Reference data props, ID-based form state
- `src/features/reference-data/queries/get-reference-options.ts` - Lightweight query for active ref options
- `src/app/admin/accounts/new/page.tsx` - Fetches and passes referenceData to form

## Decisions Made
- Replaced hardcoded constant arrays in account-form.tsx with `referenceData` prop pattern (server fetches, client renders)
- Renamed `syncAccountStringRelation` to `syncAccountFKRelation` to reflect UUID-based FK sync
- Added WithRef type variants rather than modifying base database Row types
- Account CC services handled specially in addAccountRelation (no account_id column)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed account_cc_services insert in addAccountRelation**
- **Found during:** Task 2
- **Issue:** `addAccountRelation` always adds `account_id` to insert values, but `account_cc_services` has no `account_id` column
- **Fix:** Added conditional check to skip `account_id` for `account_cc_services` table
- **Files modified:** `src/features/accounts/actions/manage-account-relations.ts`
- **Committed in:** 8a9466f (Task 2 commit)

**2. [Rule 1 - Bug] Fixed TypeScript errors with Select onValueChange null handling**
- **Found during:** Task 2 (tsc verification)
- **Issue:** Radix Select's `onValueChange` passes `string | null` but handlers expected `string`
- **Fix:** Added null guard (`if (!v) return`) in CC and hosting provider Select handlers
- **Files modified:** `src/features/accounts/components/account-form.tsx`
- **Committed in:** 8a9466f (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (2 bugs)
**Impact on plan:** Both fixes necessary for correct compilation and runtime behavior. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All account junction tables work with FK references end-to-end
- Reference data query pattern established for reuse in other features
- Database types updated with all 13 ref_* tables for future feature development

## Self-Check: PASSED

All 9 files verified present. Both task commits (2348173, 8a9466f) verified in git log.

---
*Phase: 01-foundation-reference-data*
*Completed: 2026-03-20*
