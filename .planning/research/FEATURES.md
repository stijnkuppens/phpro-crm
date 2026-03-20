# Feature Research

**Domain:** Consultancy CRM — staffing, contracts, tariff management, and revenue analytics
**Researched:** 2026-03-20
**Confidence:** HIGH (primary source: demo_crm/src/App.tsx — the authoritative feature spec for this port)

---

## Context

This is a port project, not a greenfield product. The demo Vue app (`demo_crm/src/App.tsx`, ~5800 lines)
is the definitive feature specification. The goal is 100% feature parity. Classification below reflects
which features are "table stakes for a consultancy CRM as a category" vs. "differentiating capabilities
specific to PHPro's workflow."

The existing Next.js project already has a substantial feature set. The analysis here focuses on what
remains to be built (the Active items in PROJECT.md) while also cataloguing the full domain for
roadmap phase ordering.

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features that any consultancy-focused CRM must have. Missing these makes the product feel incomplete
or unusable for the target persona (sales manager, staffing coordinator, project manager).

| Feature | Why Expected | Complexity | Status | Notes |
|---------|--------------|------------|--------|-------|
| Account CRUD with type/status/health scoring | Core CRM primitive; no CRM ships without it | LOW | DONE | All 7 tabs needed on detail view |
| Contact management with role classification | Decision makers vs. influencers is critical for sales | MEDIUM | DONE | Steerco flag and role tracking pending |
| Deal pipeline with stage tracking | Core CRM primitive | MEDIUM | DONE | Multiple pipeline types (Projecten, RFP, Consultancy) |
| Deal kanban board | Visual sales tracking is standard | MEDIUM | DONE | — |
| Activity and task logging per account | CRM without communication history is useless | LOW | DONE | — |
| Active consultant placement list | Staffing coordinators need to see who is placed where at what rate | MEDIUM | DONE | Contract attribution (direct vs CC) pending |
| Bench consultant management | Consultancies always track who is available for placement | MEDIUM | DONE | Quick-deal-from-bench pending |
| Hourly rate management per account per year per role | Framework contract rates are the commercial foundation | HIGH | PARTIAL | contracts-tab.tsx exists; full 7-section view pending |
| Contract status tracking (raamcontract, servicecontract) | Framework agreements define the commercial relationship | MEDIUM | PARTIAL | Basic contract model present; full sections pending |
| Revenue by client and service | Managers need to see actual vs forecast revenue | HIGH | PARTIAL | omzet-tab.tsx exists; multi-year grid and per-account view pending |
| Dashboard with KPI stats | Users expect a landing page with pipeline and staffing health at a glance | MEDIUM | PARTIAL | Stats exist; activity feed and pipeline stage overview pending |
| Search and filter on all list views | Standard UX expectation | LOW | DONE | — |
| User roles and access control | Multiple personas use the system | MEDIUM | DONE | — |

### Differentiators (Competitive Advantage)

Features that are specific to PHPro's consultancy model. These set the product apart from generic CRMs
and reflect the Cronos Group/competence center structure.

| Feature | Value Proposition | Complexity | Status | Notes |
|---------|-------------------|------------|--------|-------|
| Indexation simulator (4-step wizard: simulate → draft → negotiate → approve) | Automates the annual rate increase workflow; eliminates spreadsheet hell | HIGH | PARTIAL | Wizard exists; indexeringDrafts persistence and history view pending |
| Contract attribution: direct vs. Competence Center with split % | PHPro-specific: revenue can flow via a CC with a defined split (4% or 50/50) | MEDIUM | PARTIAL | ContractAttrib modal in demo; persistence in Next.js project pending |
| SLA tariff management with tool/module tracking | SLA contracts have a different structure from hourly; flat monthly + hourly support + per-tool fees | HIGH | PARTIAL | slaTarieven model defined; full management UI pending |
| Indexation history view per account | Audit trail of all past rate changes with Agoria index references | MEDIUM | NOT STARTED | IndexeringHistoryView in demo; not yet in Next.js project |
| Contract attribution indicator on consultant list | Visual signal showing "via CC" vs "rechtstreeks" on every placement row | LOW | PARTIAL | Demo has CAIndicator; persistence model pending |
| Consultant contract expiry alerts (≤60 days) | Proactive follow-up: alert when opzegtermijn deadline approaches | LOW | DONE | daysUntilDate + alert bar exists in Next.js project |
| Revenue analytics: multi-year grid with client/division/service drill-down | Hierarchical revenue view expandable from client → division → service, sortable by any column/year | HIGH | PARTIAL | revenue-page-client.tsx exists; multi-level expansion and sort pending |
| Prognose: per-service forecast with copy/custom/stop mode | Structured annual forecast that distinguishes new vs. continuing services | HIGH | PARTIAL | prognose-editor.tsx exists; year-over-year comparison view pending |
| Pipeline analytics tab (RT pipeline view) | Pipeline health as revenue contribution view, not just deal count | HIGH | PARTIAL | pipeline-page-client.tsx exists; full RTForecastTab equivalent pending |
| Bench → Active pipeline quick-create | Create a consultancy profile deal directly from a bench consultant record | LOW | NOT STARTED | QuickDealModal in demo (line 3285) |
| Deal origin tracking: rechtstreeks vs. Cronos with CC metadata | Tracks how a deal was originated for commission/attribution reporting | LOW | NOT STARTED | fields in DealModal; persistence pending |
| Hosting environment CRUD per account | Tracks production/staging/dev/test envs with provider | MEDIUM | NOT STARTED | HostingTab in AccountDetail; no equivalent in Next.js project |
| Per-account revenue tab on account detail page | Revenue history visible in context of the account relationship | MEDIUM | NOT STARTED | OmzetTab in AccountDetail; getAccountRevenue query exists but tab not wired |
| Contact steering committee flag | Marks contacts as steerco members for escalation targeting | LOW | NOT STARTED | steerco boolean in demo contact model |
| Consultant rate history timeline | Shows all past tarief changes with date, amount, reason, and notes | LOW | PARTIAL | tariefhistoriek tracked; ConsultantDetailModal view pending |
| Employee 6-tab detail (overview, salary, documents, equipment, leave, evaluations) | Full HR view for internal employees | HIGH | DONE | PeopleDetail in Next.js project exists |
| Materials/equipment cross-employee list | Track who has what hardware across the team | MEDIUM | DONE | MaterialsPage in Next.js project exists |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Client-side data filtering | Feels faster to implement | Breaks pagination, only works on current page, wrong results when data exceeds page size | Push all filtering to Supabase query params via eqFilters/orFilter (CLAUDE.md rule) |
| Real-time sync on revenue grids | Appealing for collaborative editing | Revenue grids are complex computed views; real-time updates cause row jitter and stale aggregates | Explicit save + revalidatePath; useRealtime only on notification-style views |
| Drag-and-drop deal stage reordering | Feels like a power feature | Demo only implied it without persistence; high implementation cost for low usage frequency | Explicit stage assignment in deal form (already out of scope per PROJECT.md) |
| Email sending from CRM | Users want to close the loop in the app | Adds OAuth, inbox sync, deliverability complexity; demo only logged communications | Log communications manually with type=email (already the demo pattern) |
| Mobile app | Consultants on the go | Out-of-scope per PROJECT.md; responsive web covers the real need | Responsive web UI with shadcn/ui components |
| External integrations (Jira, Salesforce, etc.) | Enterprise expectation | Out of scope per PROJECT.md; adds API surface area, auth complexity, webhook maintenance | Manual data entry with audit log for traceability |
| Pixel-perfect Vue demo recreation | Feels like fidelity | Demo UI is rough prototype-quality; production should follow shadcn/ui patterns | Feature-faithful port (PROJECT.md key decision) |
| Barrel file re-exports | Feels organized | Prevents tree-shaking, inflates client bundles (CLAUDE.md rule) | Direct imports from file paths |

---

## Feature Dependencies

```
Indexation Simulator
    └──requires──> Contract model (uurtarieven per account per year)
                       └──requires──> Account exists
                       └──requires──> TARIEF_ROLLEN reference data in supabase/data/

Contract Attribution
    └──requires──> Active consultant placement
                       └──requires──> Account exists
    └──requires──> Contact exists (for rechtstreeks linkage)
    └──requires──> CC_NAMEN reference data in supabase/data/

Revenue Analytics Grid (multi-year)
    └──requires──> Per-account revenue entries (omzet)
                       └──requires──> Account exists
    └──requires──> Service/division reference data

Prognose Tab
    └──requires──> Historical revenue data (at least one year)
    └──enhances──> Revenue Analytics Grid

Pipeline Analytics Tab
    └──requires──> Deal data with pipeline/stage
    └──enhances──> Prognose Tab

Quick Deal from Bench
    └──requires──> Bench consultant exists
    └──requires──> Consultancy pipeline (pl3) defined in supabase/data/

Deal Origin Tracking
    └──requires──> Deal CRUD
    └──requires──> CC_NAMEN reference data

Hosting Environment CRUD
    └──requires──> Account exists
    └──requires──> HOSTING_PROVIDERS + HOSTING_OMGEVINGEN reference data in supabase/data/

Indexation History View
    └──requires──> Indexation Simulator (history is created by approved simulations)

SLA Tariff management
    └──requires──> Contract model (slaTarieven array)
    └──requires──> SLA_TOOL_SUGGESTIONS reference data in supabase/data/

Contact Steerco Flag
    └──requires──> Contact CRUD (minor field addition)
```

### Dependency Notes

- **Reference data blocks many features:** CC_NAMEN, TARIEF_ROLLEN, SLA_TOOL_SUGGESTIONS, HOSTING_PROVIDERS, AGORIA_INDICES, CONSULTANT_ROLES, CC_SERVICES, VERDELING_OPTIES must all exist in `supabase/data/` before dependent features can be tested with realistic data. This makes reference data a Phase 1 prerequisite.
- **Contract model is a hub:** Indexation, hourly rates, SLA tariffs, indexation history, and contract attribution all extend the `accounts.contract` shape. Any migration to the contract schema affects all five.
- **Prognose and Revenue Analytics share data:** Both read from the same omzet entries. Implement omzet persistence first, then build both views on top.

---

## MVP Definition

### Launch With (v1) — Feature Parity

This is a port project. "MVP" means 100% feature parity with demo_crm. All features in the demo must
be working before the project is considered complete per PROJECT.md.

- [ ] Account detail — all 7 tabs fully functional (overview, contacts, deals, activities, contracts, communication, revenue)
- [ ] Contract tabs — full 7-section view (raamcontract, servicecontract, bestelbon, hourly tariffs, SLA tariffs, indexation history, contract attribution)
- [ ] Consultant contract attribution (direct vs. CC with split %)
- [ ] Indexation drafts persistence and history view
- [ ] Revenue multi-year grid with client/division/service drill-down
- [ ] Prognose editing with year-over-year comparison
- [ ] Pipeline analytics tab (revenue contribution view)
- [ ] Per-account revenue tab on account detail
- [ ] Hosting environment CRUD per account
- [ ] Contact steerco flag
- [ ] Quick deal creation from bench
- [ ] Deal origin tracking (rechtstreeks/cronos) with CC metadata
- [ ] All reference data in supabase/data/ (CC, roles, tools, hosting providers, Agoria indices)
- [ ] All demo data fixtures updated/completed

### Add After Validation (v1.x)

Deferred because they are not in the demo and represent incremental improvement:

- [ ] Revenue chart visualization (bar charts for client totals) — demo has rudimentary bars; proper charting adds polish
- [ ] Consultant utilization rate calculation (billable days / total days)
- [ ] Pipeline → Revenue attribution (deal won → auto-create revenue entry)

### Future Consideration (v2+)

- [ ] AI-powered bench matching to open positions — emerging category differentiator per market research
- [ ] External API integrations (Exact, Teamleader) — explicitly out of scope for v1

---

## Feature Prioritization Matrix

Ordering for roadmap phases. Lower implementation cost + higher blocking potential = earlier phase.

| Feature | User Value | Implementation Cost | Priority | Blocks Others? |
|---------|------------|---------------------|----------|----------------|
| Reference data (CC, roles, tools, hosting) | HIGH | LOW | P1 | YES — many features |
| Account detail: remaining tabs wiring | HIGH | MEDIUM | P1 | YES — contracts, revenue, contacts |
| Contract tab full 7-section view | HIGH | HIGH | P1 | YES — indexation, SLA |
| Per-account revenue tab | HIGH | MEDIUM | P1 | YES — prognose |
| Consultant contract attribution (direct vs CC) | HIGH | MEDIUM | P1 | NO |
| Indexation drafts persistence | HIGH | MEDIUM | P1 | YES — indexation history |
| Contact steerco flag | MEDIUM | LOW | P1 | NO |
| Hosting environment CRUD | MEDIUM | MEDIUM | P2 | NO |
| SLA tariff tools management | MEDIUM | MEDIUM | P2 | NO |
| Indexation history view | MEDIUM | LOW | P2 | NO |
| Revenue multi-year grid (multi-level) | HIGH | HIGH | P2 | YES — prognose |
| Quick deal from bench | MEDIUM | LOW | P2 | NO |
| Deal origin tracking | MEDIUM | LOW | P2 | NO |
| Prognose editing with year comparison | HIGH | HIGH | P2 | NO |
| Pipeline analytics tab | MEDIUM | HIGH | P3 | NO |
| Dashboard activity feed | LOW | MEDIUM | P3 | NO |
| All missing fixtures/demo data | MEDIUM | MEDIUM | P1 | YES — local dev |

**Priority key:**
- P1: Must have — blocks other work or is core user workflow
- P2: Should have — completes a domain, not blocking
- P3: Nice to have — polish or low-frequency workflow

---

## Sources

- `demo_crm/src/App.tsx` (lines 1–5809) — authoritative feature specification (HIGH confidence)
- `demo_crm/src/constants.ts` — reference data schema (HIGH confidence)
- `.planning/PROJECT.md` — validated vs. active feature list (HIGH confidence)
- [Contract Staffing: The Ultimate Agency Playbook](https://atzcrm.com/blog/contract-staffing-playbook/) — industry patterns for staffing CRMs (MEDIUM confidence)
- [How IT Consulting Firms Can Fix Bench Management](https://www.operating.app/blog-posts/bench-management-it-consulting) — bench management best practices (MEDIUM confidence)
- [Top 10 Consulting CRM](https://productive.io/blog/consulting-crm/) — competitive landscape overview (LOW confidence, used for table-stakes validation only)

---
*Feature research for: PHPro CRM — consultancy staffing, contracts, and revenue analytics*
*Researched: 2026-03-20*
