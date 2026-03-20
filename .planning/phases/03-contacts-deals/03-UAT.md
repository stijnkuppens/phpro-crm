---
status: testing
phase: 03-contacts-deals
source: [03-01-SUMMARY.md, 03-02-SUMMARY.md, 03-03-SUMMARY.md, 03-04-SUMMARY.md, 03-05-SUMMARY.md]
started: 2026-03-20T17:30:00Z
updated: 2026-03-20T17:30:00Z
---

## Current Test

number: 1
name: Steerco Badge in Contact List
expected: |
  Navigate to /admin/contacts. Contacts with is_steerco=true show a small "Steerco" badge next to their name in the name column.
awaiting: user response

## Tests

### 1. Steerco Badge in Contact List
expected: Navigate to /admin/contacts. Contacts with is_steerco=true show a small "Steerco" badge next to their name in the name column.
result: [pending]

### 2. Contact Role Filter
expected: On /admin/contacts, a role dropdown filter exists with 9 options (Decision Maker, Influencer, Champion, Sponsor, Steerco Lid, Technisch, Financieel, Operationeel, Contact). Selecting "Steerco Lid" filters to only steerco contacts. Other roles filter by that role.
result: [pending]

### 3. Contact Steerco Toggle
expected: On /admin/contacts, a toggle/button for steerco filtering exists alongside the role dropdown. Activating it filters to only is_steerco=true contacts.
result: [pending]

### 4. Contact Personal Info Card
expected: Navigate to a contact detail page (/admin/contacts/[id]). A "Persoonlijke Info" card shows all personal info fields (hobbies, verjaardag, burgerlijke staat, kinderen, partner, cadeauvoorkeur, etc.) in a 2-column grid.
result: [pending]

### 5. Contact Personal Info Inline Edit
expected: On the contact detail personal info card, click "Bewerken". Fields become editable form inputs. Change a value, click save. A success toast appears and the updated value persists on refresh.
result: [pending]

### 6. Deal Origin Badge in List
expected: Navigate to /admin/deals. Deals show an origin badge in the title column: green "Direct" for rechtstreeks, blue "Cronos" for cronos origin.
result: [pending]

### 7. Deal Origin Badge in Kanban
expected: On /admin/deals, switch to Pipeline view. Kanban cards show the origin badge (Direct/Cronos) on each deal card.
result: [pending]

### 8. Deals Page Sub-Views
expected: On /admin/deals, three view options exist: "Deals" (list table), "Pipeline" (kanban board), and "Archief" (closed deals). Each view shows the correct subset of deals.
result: [pending]

### 9. Origin Filter on Deals
expected: On /admin/deals list view, an origin filter dropdown exists. Selecting "Direct" or "Cronos" filters deals server-side to that origin only.
result: [pending]

### 10. Quick Deal from Bench
expected: Navigate to /admin/bench, open a consultant detail modal. A "Maak deal aan" button is visible. Clicking it opens the QuickDealModal pre-filled with the consultant's name, role, and auto-selects "Consultancy Profielen" pipeline.
result: [pending]

### 11. Quick Deal from Deals Page
expected: On /admin/deals, an "RFP / Profiel" button exists. Clicking it opens the QuickDealModal with RFP/Consultancy toggle. Fields change based on pipeline selection (amount for RFP, hourly rates for Consultancy).
result: [pending]

### 12. Deal Detail Linked Tabs
expected: Navigate to a deal detail page (/admin/deals/[id]). Tabs for "Activiteiten", "Taken", and "Communicatie" are visible below deal info. Each tab shows records linked to this specific deal, or an empty state message.
result: [pending]

### 13. Close Deal from Detail
expected: On a deal detail page for an open deal, a "Deal sluiten" button is visible. Clicking it opens a modal with won/lost/longterm selection, reason field, and notes. Submitting closes the deal and the page refreshes to show the closure info.
result: [pending]

## Summary

total: 13
passed: 0
issues: 0
pending: 13
skipped: 0

## Gaps

[none yet]
