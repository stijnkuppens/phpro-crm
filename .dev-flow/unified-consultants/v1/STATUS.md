# Status: Unified Consultants v1

## Feature
Merge bench_consultants and active_consultants into one `consultants` table. Single DataTable view with status-based filtering (Bench/Actief/Stopgezet), proper row actions per status, bench creation flow, remove manual add from account page.

## Current Phase
complete

## Checklist
- [x] Initialized
- [x] Scope assessed (medium)
- [x] Design questions answered
- [x] Design approved (user)
- [x] Design doc written (DESIGN.md)
- [x] Research complete
- [x] Spec written (SPEC.md)
- [x] Skill discovery complete
- [x] Plan written (with skill annotations)
- [x] Uncertainty markers resolved
- [x] Pre-implementation gates passed
- [x] Plan flywheel pass 1 complete
- [x] Plan fixes applied
- [x] Plan flywheel pass 2 complete
- [x] Plan approved (user)
- [x] Execution complete
- [x] Review passed
- [x] Test gate passed (tsc --noEmit: 0 errors)
- [x] Stub check passed

## Subplan Progress
- [x] Subplan 1: DB Migration — completed — DONE (code review fixes applied)
- [x] Subplan 2: Types & Queries — completed — DONE
- [x] Subplan 3: Server Actions — completed — DONE
- [x] Subplan 4: DataTable & Page — completed — DONE (parallel with SP5)
- [x] Subplan 5: Bench Form & Uploads — completed — DONE (parallel with SP4)
- [x] Subplan 6: Cleanup — completed — DONE (found and fixed extra refs in deals, search-accounts, sidebar)

## Gotchas
- No FK between old bench and active tables — skip all archived bench rows in migration
- Migration number must be 00069 (00065-00068 already exist)
- avatar_path is a net-new column — neither source table has it
- SECURITY DEFINER functions need SET search_path = public
- SP6 found unexpected old references in deals/types.ts, search-accounts.ts, sidebar — always grep entire src/
