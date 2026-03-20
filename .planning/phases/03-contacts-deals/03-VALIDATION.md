---
phase: 3
slug: contacts-deals
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-20
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Next.js dev server + manual browser verification |
| **Config file** | next.config.ts |
| **Quick run command** | `npx tsc --noEmit` |
| **Full suite command** | `npx tsc --noEmit && npx next lint` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx tsc --noEmit`
- **After every plan wave:** Run `npx tsc --noEmit && npx next lint`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | CONT-01 | type-check + grep | `npx tsc --noEmit && grep -l 'Steerco Lid' src/features/contacts/types.ts` | ✅ | ⬜ pending |
| 03-01-02 | 01 | 1 | CONT-02 | type-check + grep | `npx tsc --noEmit && grep -l 'is_steerco' src/features/contacts/columns.tsx` | ❌ W0 | ⬜ pending |
| 03-02-01 | 02 | 1 | CONT-03 | type-check + grep | `npx tsc --noEmit && grep -l 'personalInfoFormSchema' src/features/contacts/components/contact-detail.tsx` | ✅ | ⬜ pending |
| 03-03-01 | 03 | 2 | DEAL-01 | type-check + grep | `npx tsc --noEmit && grep -l 'origin' src/features/deals/columns.tsx` | ❌ W0 | ⬜ pending |
| 03-03-02 | 03 | 2 | DEAL-03 | grep | `grep -l 'closeDealSchema' src/features/deals/actions/close-deal.ts` | ✅ | ⬜ pending |
| 03-04-01 | 04 | 2 | DEAL-02 | type-check + grep | `npx tsc --noEmit && grep -l 'QuickDealModal' src/features/deals/components/` | ❌ W0 | ⬜ pending |
| 03-05-01 | 05 | 2 | DEAL-04, DEAL-05 | type-check + grep | `npx tsc --noEmit && grep -l 'deal_id' src/features/activities/queries/` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Rename `src/features/contacts/columns.ts` → `columns.tsx` for JSX badge support
- [ ] Rename `src/features/deals/columns.ts` → `columns.tsx` for JSX badge support

*Existing infrastructure covers most phase requirements — only column file renames needed for JSX support.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Steerco badge visible in contact list | CONT-01 | Visual UI check | Navigate to /admin/contacts, verify steerco contacts show badge |
| Origin badge on kanban cards | DEAL-01 | Visual UI check | Navigate to /admin/deals, switch to Pipeline view, verify origin badges |
| Quick deal pre-fill from bench | DEAL-02 | UI interaction flow | Open bench consultant detail, click "Maak deal aan", verify fields pre-filled |
| Kanban shows pipeline-specific stages | DEAL-05 | Visual UI check | Switch between pipeline tabs on kanban, verify correct stage columns |
| Deal detail linked data | DEAL-04 | Data relationship check | Navigate to deal detail, verify activities/tasks/communications tabs show deal-specific data |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
