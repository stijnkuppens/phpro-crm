---
phase: 1
slug: foundation-reference-data
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-20
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | SQL validation via `psql` / bash scripts; TypeScript build check via `npx tsc --noEmit` |
| **Config file** | `tsconfig.json` (existing) |
| **Quick run command** | `docker compose exec db psql -U postgres -d postgres -c "SELECT count(*) FROM ref_competence_centers;"` |
| **Full suite command** | `task db:reset && npx tsc --noEmit` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run quick SQL validation for affected reference tables
- **After every plan wave:** Run `task db:reset && npx tsc --noEmit`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | FOUND-01 | SQL query | `psql -c "SELECT name FROM ref_competence_centers LIMIT 1;"` | ❌ W0 | ⬜ pending |
| 01-02-01 | 02 | 1 | FOUND-02 | SQL query | `task db:reset` (exits 0, no FK errors) | ❌ W0 | ⬜ pending |
| 01-03-01 | 03 | 1 | FOUND-03 | TS build | `npx tsc --noEmit` | ✅ | ⬜ pending |
| 01-03-02 | 03 | 1 | FOUND-04 | TS build | `npx tsc --noEmit` (react-number-format importable) | ✅ | ⬜ pending |
| 01-03-03 | 03 | 1 | FOUND-05 | TS build | `npx tsc --noEmit` (nuqs importable) | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] SQL validation scripts for reference table row counts
- [ ] `task db:reset` must exit cleanly as integration test

*Existing infrastructure (TypeScript compiler, Docker Compose DB) covers library validation.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Admin UI for reference tables renders | FOUND-01 | UI rendering | Navigate to /admin/settings/reference-data, verify tables load |
| NuqsAdapter doesn't break existing pages | FOUND-05 | Provider integration | Navigate to /admin/accounts, verify filters still work |

---

## Validation Sign-Off

- [ ] All tasks have automated verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
