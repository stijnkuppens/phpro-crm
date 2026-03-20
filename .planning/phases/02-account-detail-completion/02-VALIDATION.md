---
phase: 2
slug: account-detail-completion
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-20
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Next.js dev server + manual browser verification |
| **Config file** | next.config.ts |
| **Quick run command** | `npx tsc --noEmit` |
| **Full suite command** | `npx tsc --noEmit && npx next build` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx tsc --noEmit`
- **After every plan wave:** Run `npx tsc --noEmit && npx next build`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-T1 | 01 | 1 | ACCT-01 | type-check | `npx tsc --noEmit` | ✅ | ⬜ pending |
| 02-01-T2 | 01 | 1 | ACCT-01 | type-check | `npx tsc --noEmit` | ✅ | ⬜ pending |
| 02-02-T1 | 02 | 1 | ACCT-03, ACCT-06 | type-check | `npx tsc --noEmit` | ✅ | ⬜ pending |
| 02-02-T2 | 02 | 1 | ACCT-03, ACCT-06 | type-check | `npx tsc --noEmit` | ✅ | ⬜ pending |
| 02-03-T1 | 03 | 2 | ACCT-01, ACCT-05 | type-check | `npx tsc --noEmit` | ✅ | ⬜ pending |
| 02-03-T2 | 03 | 2 | ACCT-01, ACCT-05 | type-check | `npx tsc --noEmit` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. No new test framework needed.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| All 8 tabs render with data | ACCT-01 | Visual UI verification | Navigate to account detail, click each tab |
| Hosting CRUD persists | ACCT-03 | DB persistence check | Create/edit/delete hosting, refresh, verify |
| Communication timeline with linked names | ACCT-05 | Visual + data check | Create communication, verify contact/deal badges |
| Multi-select editors on edit page | ACCT-06 | Interactive UI check | Edit account, add/remove tech stacks, verify persist |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
