---
phase: 03-contacts-deals
plan: 03
subsystem: ui
tags: [deals, kanban, origin-badge, server-side-filtering, supabase]

requires:
  - phase: 01-reference-data
    provides: pipeline and stage reference data
provides:
  - Deal origin badges in list and kanban views
  - 3-view deals page (Deals/Pipeline/Archief)
  - Server-side closed deal filtering
  - Origin filter dropdown
affects: []

tech-stack:
  added: []
  patterns: [server-side view-mode filtering, origin badge pattern]

key-files:
  created:
    - src/features/deals/columns.tsx
  modified:
    - src/features/deals/types.ts
    - src/features/deals/components/deals-page-client.tsx
    - src/features/deals/components/deal-kanban.tsx
    - src/features/deals/queries/get-deals.ts
    - src/features/deals/queries/get-deals-by-pipeline.ts
    - src/app/admin/deals/page.tsx

key-decisions:
  - "Cast origin filter to enum type for Supabase typed query compatibility"

patterns-established:
  - "View-mode-based server-side filtering: kanban/archief/list each apply different closed_at filters at query level"
  - "Origin badge pattern: ORIGIN_BADGE constant mapping DB values to display labels and Tailwind classes"

requirements-completed: [DEAL-01, DEAL-03, DEAL-05]

duration: 4min
completed: 2026-03-20
---

# Phase 3 Plan 3: Deal Origin Badges & Pipeline Sub-Views Summary

**Deal origin badges (Direct/Cronos) in list and kanban, 3-view page (Deals/Pipeline/Archief), server-side closed deal filtering replacing client-side .filter()**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-20T16:53:13Z
- **Completed:** 2026-03-20T16:57:56Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Origin badges (green "Direct", blue "Cronos") visible in deal list title column and kanban cards
- Deals page restructured with 3 sub-views: Deals (list), Pipeline (kanban), Archief (closed deals)
- Closed deal filtering moved from client-side `.filter()` to server-side Supabase query
- Origin filter dropdown added with server-side filtering
- Initial page.tsx fetch now serves active-only deals for kanban view

## Task Commits

Each task was committed atomically:

1. **Task 1: Add origin to DealCard type, rename columns to .tsx with origin badge** - `5684d4d` (feat)
2. **Task 2: Restructure deals page to 3 sub-views with server-side filtering** - `e2228d6` (feat)

## Files Created/Modified
- `src/features/deals/columns.tsx` - Renamed from .ts, added JSX origin badge in title column
- `src/features/deals/types.ts` - Added origin to DealCard, origin/is_closed to DealFilters
- `src/features/deals/components/deals-page-client.tsx` - 3 sub-views, server-side closed filtering, origin filter dropdown
- `src/features/deals/components/deal-kanban.tsx` - Origin badge on kanban cards
- `src/features/deals/queries/get-deals.ts` - Added origin and is_closed filter support
- `src/features/deals/queries/get-deals-by-pipeline.ts` - Added origin field to DealCard mapping
- `src/app/admin/deals/page.tsx` - Initial fetch filters to active deals only

## Decisions Made
- Cast origin filter values to enum type (`'rechtstreeks' | 'cronos'`) for Supabase typed query compatibility

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed get-deals-by-pipeline.ts missing origin field**
- **Found during:** Task 2
- **Issue:** DealCard type gained `origin` field but getDealsByPipeline query didn't select or map it
- **Fix:** Added `origin` to select clause and mapping
- **Files modified:** src/features/deals/queries/get-deals-by-pipeline.ts
- **Verification:** TypeScript compilation passes
- **Committed in:** e2228d6 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Necessary fix for type compatibility. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Deal origin tracking fully visible in list and kanban views
- Pipeline sub-views functional with server-side filtering
- Close-deal-modal exists as standalone component (not yet wired into deals page)

---
*Phase: 03-contacts-deals*
*Completed: 2026-03-20*

## Self-Check: PASSED

All 7 files verified present. Both task commits (5684d4d, e2228d6) verified in git log.
