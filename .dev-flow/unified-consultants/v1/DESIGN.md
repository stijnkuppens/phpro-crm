# Design: Unified Consultants

## Problem
Bench and active consultants are split across two tables and two separate pages, making the consultant lifecycle (Bench → Actief → Stopgezet) fragmented. Users need one overview with clear status-based filtering and actions.

## Design Decisions
- **One `consultants` table**: Merge `bench_consultants` + `active_consultants` into a single table with a `status` column (`bench` | `actief` | `stopgezet`). Eliminates unions/views and simplifies all queries.
- **Nullable bench fields**: Bench-specific columns (technologies[], languages, priority, available_date, rate range) are nullable. Populated when status=bench, null when actief/stopgezet.
- **Default filter = Bench + Actief**: Stopgezet hidden by default (toggle-able). Stopped consultants are historical.
- **Sub-statuses on Actief only**: Waarschuwing/Kritiek/Verlopen shown as secondary info (contract date coloring). Stopgezet = just gray badge.
- **Always enter through bench**: Remove "Manueel toevoegen" from account page. New consultant = BenchFormModal.

## Behaviors
- Single DataTable on `/admin/consultants` with all consultants
- Status badge per row: green "Actief", orange "Bench", gray "Stopgezet"
- Filter pills for status + search by name/role/account
- Row actions vary by status:
  - Bench: Koppel, Bewerk, Archiveer
  - Actief: Bekijken, Bewerk, Verlengen, Tariefwijziging, Stopzetten
  - Stopgezet: Bekijken, Naar bench
- "Nieuwe consultant" button → BenchFormModal
- Link wizard adapted to work with unified table
- CV upload on bench form and detail view
- Consultant avatar management (upload/display)
- Account detail "Consultants" tab keeps only "Consultant koppelen"
- `/admin/bench` route removed

## Scope
**In scope:**
- Database migration (merge tables, data migration)
- Unified DataTable with status filtering
- Bench creation form (BenchFormModal)
- All row actions per status
- Link wizard adaptation
- CV upload
- Consultant avatar management
- Remove manual add from account page
- Remove /admin/bench route
- Update account consultants tab

**Out of scope:**
- Nothing — full scope
