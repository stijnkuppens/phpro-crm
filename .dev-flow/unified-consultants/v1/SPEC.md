# Spec: Unified Consultants

## Requirements

- **Single table:** All consultants (bench, active, stopped) in one `consultants` table with `status` column
- **Single DataTable:** One page at /admin/consultants showing all consultants with status-based filtering
- **Status badges:** Green "Actief", Orange "Bench", Gray "Stopgezet" per row
- **Default filter:** Bench + Actief visible, Stopgezet hidden
- **Active sub-statuses:** Waarschuwing/Kritiek/Verlopen shown via contract date coloring for active consultants
- **Row actions by status:**
  - Bench: Koppel, Bewerk, Archiveer
  - Actief: Bekijken, Bewerk, Verlengen, Tariefwijziging, Stopzetten
  - Stopgezet: Bekijken, Naar bench
- **Bench creation:** "Nieuwe consultant" button → BenchFormModal (always enters as bench)
- **Link wizard:** Adapted to work with unified table (update status bench→actief)
- **CV upload:** On bench form and detail view using PdfUploadField
- **Avatar:** Upload/display on consultant form and detail using AvatarUpload
- **Remove manual add:** No more "Manueel toevoegen" on account page
- **Remove /admin/bench:** Single entry point at /admin/consultants
- **Account tab:** Shows only that account's active consultants + "Consultant koppelen" button

## Acceptance Criteria

- [ ] Single `consultants` table exists with status column ('bench'|'actief'|'stopgezet')
- [ ] Old tables (bench_consultants, active_consultants) are dropped
- [ ] All child table FKs point to `consultants.id`
- [ ] deals.consultant_id FK works (renamed from bench_consultant_id)
- [ ] Data migration preserves all existing bench and active consultant records
- [ ] Fixtures seed unified table correctly (`task db:reset` succeeds)
- [ ] /admin/consultants shows unified DataTable with all consultants
- [ ] Status filter pills work (default: Bench + Actief)
- [ ] Search works across name, role, account
- [ ] Row actions match spec per status
- [ ] "Nieuwe consultant" creates bench consultant via BenchFormModal
- [ ] Link wizard updates consultant status from bench→actief
- [ ] Stop action sets status to stopgezet
- [ ] "Naar bench" action resets consultant to bench status
- [ ] CV upload works on bench form
- [ ] Avatar upload works on consultant form/detail
- [ ] /admin/bench route is removed
- [ ] Account consultants tab has no "Manueel toevoegen"
- [ ] Account consultants tab shows "Consultant koppelen" only
- [ ] `task db:reset` completes without errors
- [ ] App builds without TypeScript errors (`npm run build`)

## Constraints
- Follow existing feature module structure (CLAUDE.md)
- Use ActionResult<T> pattern for all server actions
- Queries wrapped in React.cache()
- Server-first data flow (no client-side fetch waterfalls)
- Dutch UI labels
- Badge styling per style guide (semantic colors)
- No barrel files
