# PHPro CRM — Full Demo Port

## What This Is

A complete CRM for PHPro, a digital services agency within the Cronos Group. It manages the full business cycle: client accounts, sales pipelines, consultant staffing (bench + active placements), contracts & tariffs, HR/people management, and revenue analytics. Built on Next.js 16 + Supabase, porting every feature from the demo_crm Vue prototype into a production-grade application.

## Core Value

Every feature from the demo CRM must exist in this project with full backend persistence, server-first data flow, and multi-language support — achieving 100% feature parity.

## Requirements

### Validated

<!-- Existing features confirmed working in the Next.js project -->

- ✓ Account CRUD with type/status/owner/health — existing
- ✓ Account relations (tech stacks, services, competence centers, hosting, samenwerkingsvormen) — existing
- ✓ Contact CRUD with personal info (hobbies, family, birthday, invites) — existing
- ✓ Deal CRUD with pipeline/stage/amount/probability — existing
- ✓ Deal kanban board — existing
- ✓ Close deal modal (won/lost/longterm) — existing
- ✓ Activity CRUD (meetings, calls, emails) — existing
- ✓ Task CRUD with priority/status/due date — existing
- ✓ Communication logging per account — existing
- ✓ Active consultant management (deploy, extend, stop, rate change) — existing
- ✓ Bench consultant management (create, archive, reactivate) — existing
- ✓ Contract management (framework, service, hourly rates, SLA rates) — existing
- ✓ Indexation simulator (4-step wizard: simulate, draft, negotiate, approve) — existing
- ✓ Employee CRUD with 6-tab detail (overview, salary, documents, equipment, leave, evaluations) — existing
- ✓ Equipment/materials tracking — existing
- ✓ Revenue analytics (by client, division, service, month/year) — existing
- ✓ Prognose/forecast page — existing
- ✓ Pipeline analytics — existing
- ✓ Dashboard with stats — existing
- ✓ User management with roles — existing
- ✓ Audit logging — existing
- ✓ Notification system — existing
- ✓ File management with folder structure — existing
- ✓ Authentication with Supabase — existing
- ✓ Multi-language support (i18n) — existing
- ✓ RLS on all tables — existing
- ✓ Server-first data flow pattern — existing

### Active

<!-- Features that need gap-filling to match demo_crm 100% -->

- [ ] Full gap analysis across all 6 domains (CRM, Consultancy, Contracts, HR, Analytics, Admin)
- [ ] Account detail — all 7 tabs fully functional (overview, contacts, deals, activities, contracts, communication, revenue)
- [ ] Account revenue tab — per-account revenue by category/year
- [ ] Contract tabs — full 7-section view (raamcontract, service contract, bestelbon, hourly tariffs, SLA tariffs, indexation history, contract attribution)
- [ ] Consultant contract attribution (direct vs via Competence Center with split %)
- [ ] Quick deal creation from bench
- [ ] Deal origin tracking (rechtstreeks/cronos) with CC metadata
- [ ] Contact steering committee flag and role tracking
- [ ] Hosting environment CRUD per account
- [ ] SLA tariff tools/modules management
- [ ] Indexation history view
- [ ] Revenue by account on account detail
- [ ] Pipeline entry CRUD with monthly spread visualization
- [ ] Prognose editing with year-over-year comparison
- [ ] Dashboard activity feed and pipeline stage overview
- [ ] Reference data: competence centers, CC services, hosting providers, consultant roles, tech stack options, languages with levels, hobby suggestions, SLA tools
- [ ] All missing fixtures/demo data for development
- [ ] Every form, modal, and UI component that exists in demo but is missing or incomplete

### Out of Scope

- Drag-and-drop deal stage reordering (demo only implied it, no persistence) — skip for now
- Real-time chat or messaging — not in demo
- Mobile app — web only
- External API integrations (Jira, Salesforce, etc.) — not in demo
- Email sending — demo only logged communications

## Context

- The demo_crm is a single-file Vue/React app (~5800 lines in App.tsx) with all state in-memory
- The existing Next.js project has 21 feature modules, 30+ database tables, and follows strict architectural patterns (CLAUDE.md)
- Reference data (pipelines, roles, services, competence centers) should go in `supabase/data/` as production data
- Sample accounts, contacts, deals go in `supabase/fixtures/` as dev/staging demo data
- Multi-language is already implemented — new UI strings must be added to the i18n system
- The project uses Dutch UI labels with English code/types (e.g., type field stores "Klant" but TypeScript type is `Account`)

## Constraints

- **Architecture**: Must follow CLAUDE.md patterns — feature modules, server-first data flow, ActionResult, React.cache queries
- **Database**: Three-layer strategy — migrations (schema), data (production reference), fixtures (demo)
- **Completeness**: Every feature in demo_crm must have a working equivalent — no "we'll add it later" shortcuts
- **Multi-language**: All new UI text must go through the i18n system
- **Approach**: Phase by domain — complete one domain fully before moving to the next

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Feature-faithful port (not pixel-perfect) | Demo UI is rough; production app should follow shadcn/ui patterns | — Pending |
| Split data strategy | Reference data = production, sample entities = fixtures | — Pending |
| Phase by domain | Reduces context switching, ensures each domain is fully complete | — Pending |
| Multi-language preserved | Existing i18n system must be used for all new UI strings | — Pending |
| Full gap analysis first | Must systematically compare every demo feature vs existing code before building | — Pending |

---
*Last updated: 2026-03-20 after initialization*
