# PHPro CRM — Full Port Design Spec

**Date:** 2026-03-13
**Source:** `demo_crm/` (Vite+React prototype, ~5800 lines, in-memory state)
**Target:** `phpro_crm/` (Next.js 16 + Supabase + shadcn/ui + Tailwind v4)

## 1. Overview

Port the full PHPro CRM demo into production-quality code on the existing Next.js + Supabase stack. The demo is the source of truth for all features. The existing app provides the technical foundation (auth, RBAC, layout, shadcn/ui, Supabase clients, generic hooks).

### Decisions

| Question | Decision |
|---|---|
| Existing contacts feature | **Replace** with account-linked contact model from demo |
| HR module | **Include** — port everything |
| Language | **i18n ready** with `next-intl`, NL + EN, NL default |
| Pipelines & stages | **Database-driven** — admin-configurable at runtime |
| Database modeling | **Fully normalized** — separate tables for everything |
| Rich text editor | **Plate** (shadcn/ui-native, built on Slate) |
| Indexeringssimulator | **Full server-side workflow** with drafts and permission-gated approval |
| i18n library | **next-intl** |
| Existing DAM/files | **Keep** |
| Existing notifications | **Keep** |
| Existing audit logs | **Keep** |
| Migration approach | **Layered decomposition** — 6 sub-projects based on data dependency order |

## 2. What Gets Removed

- Existing `contacts` feature (`src/features/contacts/`, related migrations, routes)
- Demo pages (`src/app/admin/demo/*`)

## 3. What Stays

- Auth system (`src/lib/supabase/*`, `src/proxy.ts`, `useAuth`)
- RBAC framework (`src/lib/acl.ts`, `src/lib/require-permission.ts`, `RoleGuard`)
- Layout shell (`admin-sidebar.tsx`, `admin-topbar.tsx`, page transitions)
- All shadcn/ui components (`src/components/ui/*`)
- Generic admin components (`data-table.tsx`, `entity-form.tsx`, `confirm-dialog.tsx`, `error-boundary.tsx`, `page-header.tsx`, `stat-card.tsx`)
- Generic hooks (`useEntity`, `useRealtime`, `useFileUpload`)
- `user_profiles` and `app_settings` tables + migrations
- Files/DAM feature
- Notifications feature
- Audit logs feature
- Users feature
- Docker Compose, Supabase config, build tooling

## 4. Database Schema

All tables get `id (uuid PK, gen_random_uuid())`, `created_at`, `updated_at` with trigger, and RLS policies. Total: ~45 tables.

### 4.1 Foundation

**`pipelines`**
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| name | text | e.g. "Projecten" |
| type | text | projecten / rfp / consultancy |
| sort_order | int | |

**`pipeline_stages`**
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| pipeline_id | uuid FK pipelines | |
| name | text | e.g. "Lead", "Gewonnen" |
| sort_order | int | |
| probability | int | 0-100 |
| color | text | hex color |
| is_closed | bool | |
| is_won | bool | |
| is_longterm | bool | |

### 4.2 Core CRM

**`accounts`**
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| name | text | |
| domain | text | |
| type | text | Klant / Prospect / Partner |
| status | text | Actief / Inactief |
| industry | text | |
| size | text | e.g. "51-200" |
| revenue | numeric | |
| phone | text | |
| website | text | |
| address | text | |
| country | text | |
| vat_number | text | |
| owner_id | uuid FK user_profiles | |
| health | int | 0-100 |
| managing_partner | text | |
| account_director | text | |
| team | text | |
| about | text | |
| phpro_contract | text | Geen / Actief / Inactief / In onderhandeling |

**`account_manual_services`**
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| account_id | uuid FK accounts | |
| service_name | text | e.g. "Adobe Commerce", "Magento Open Source" |

Used by `getEffectiveServices` logic: manual services + auto "Consultancy" if account has active consultants.

**`account_tech_stacks`**
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| account_id | uuid FK accounts | |
| technology | text | |

**`account_samenwerkingsvormen`**
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| account_id | uuid FK accounts | |
| type | text | Project / Continuous Dev. / Ad Hoc / Support / Consultancy |

**`account_hosting`**
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| account_id | uuid FK accounts | |
| provider | text | |
| environment | text | |
| url | text | |
| notes | text | |

**`account_competence_centers`**
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| account_id | uuid FK accounts | |
| cc_name | text | |
| contact_person | text | |
| email | text | |
| phone | text | |
| distribution | text | 4% / 50/50 |

**`account_services`**
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| account_id | uuid FK accounts | |
| service_name | text | |

**`contacts`**
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| account_id | uuid FK accounts | |
| first_name | text | |
| last_name | text | |
| email | text | |
| phone | text | |
| title | text | Job title |
| role | text | Decision Maker / Influencer / Champion / etc. |
| is_steerco | bool | |
| is_pinned | bool | |

**`contact_personal_info`**
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| contact_id | uuid FK contacts | 1:1 |
| hobbies | text[] | |
| marital_status | text | |
| has_children | bool | |
| children_count | int | |
| children_names | text | |
| birthday | text | e.g. "15/03" |
| partner_name | text | |
| partner_profession | text | |
| notes | text | |
| invite_dinner | bool | |
| invite_event | bool | |
| invite_gift | bool | |

**`communications`**
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| account_id | uuid FK accounts | |
| contact_id | uuid FK contacts | nullable |
| deal_id | uuid FK deals | nullable |
| type | text | email / note / meeting / call |
| subject | text | |
| to | text | nullable, recipient |
| date | timestamptz | |
| duration_minutes | int | |
| content | jsonb | Plate rich text JSON |
| is_done | bool | |
| owner_id | uuid FK user_profiles | |

### 4.3 Sales

**`deals`**
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| title | text | |
| account_id | uuid FK accounts | |
| pipeline_id | uuid FK pipelines | |
| stage_id | uuid FK pipeline_stages | |
| amount | numeric | |
| close_date | date | |
| probability | int | |
| owner_id | uuid FK user_profiles | |
| description | text | |
| contact_id | uuid FK contacts | nullable |
| lead_source | text | |
| origin | text | rechtstreeks / cronos |
| cronos_cc | text | |
| cronos_contact | text | |
| cronos_email | text | |
| bench_consultant_id | uuid FK bench_consultants | nullable |
| consultant_role | text | |
| forecast_category | text | Commit / Best Case / Pipeline / Omit |
| closed_at | timestamptz | nullable |
| closed_type | text | won / lost / longterm, nullable |
| closed_reason | text | |
| closed_notes | text | |
| longterm_date | date | nullable, follow-up date for longterm deals |

**`activities`**
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| type | text | Meeting / Demo / Call / E-mail / Lunch / Event |
| subject | text | |
| date | timestamptz | |
| duration_minutes | int | |
| account_id | uuid FK accounts | |
| deal_id | uuid FK deals | nullable |
| owner_id | uuid FK user_profiles | |
| notes | jsonb | Plate rich text JSON |
| is_done | bool | |

**`tasks`**
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| title | text | |
| due_date | date | |
| priority | text | High / Medium / Low |
| status | text | Open / In Progress / Done |
| account_id | uuid FK accounts | nullable |
| deal_id | uuid FK deals | nullable |
| assigned_to | uuid FK user_profiles | |

### 4.4 Consultancy

**`bench_consultants`**
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| first_name | text | |
| last_name | text | |
| city | text | |
| priority | text | High / Medium / Low |
| available_date | date | |
| min_hourly_rate | numeric | |
| max_hourly_rate | numeric | |
| roles | text[] | |
| technologies | text[] | |
| description | text | |
| cv_pdf_url | text | |
| is_archived | bool | |

**`bench_consultant_languages`**
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| bench_consultant_id | uuid FK bench_consultants | |
| language | text | |
| level | text | Basis / Gevorderd / Vloeiend / Moedertaal |

**`active_consultants`**
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| account_id | uuid FK accounts | nullable, null for external clients |
| first_name | text | |
| last_name | text | |
| role | text | |
| city | text | |
| cv_pdf_url | text | |
| is_active | bool | |
| client_name | text | fallback when account_id is null |
| client_city | text | fallback when account_id is null |
| start_date | date | |
| end_date | date | nullable |
| is_indefinite | bool | |
| hourly_rate | numeric | |
| sow_url | text | |
| notice_period_days | int | |
| notes | text | |
| is_stopped | bool | |
| stop_date | date | nullable |
| stop_reason | text | |

**`consultant_rate_history`**
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| active_consultant_id | uuid FK active_consultants | |
| date | date | |
| rate | numeric | |
| reason | text | |
| notes | text | |

**`consultant_extensions`**
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| active_consultant_id | uuid FK active_consultants | |
| new_end_date | date | |
| notes | text | |

**`consultant_contract_attributions`**
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| active_consultant_id | uuid FK active_consultants | |
| type | text | rechtstreeks / cronos |
| contact_id | uuid FK contacts | nullable |
| cc_name | text | |
| cc_contact_person | text | |
| cc_email | text | |
| cc_phone | text | |
| cc_distribution | text | |

**`contracts`**
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| account_id | uuid FK accounts | 1:1 |
| has_framework_contract | bool | |
| framework_pdf_url | text | |
| framework_start | date | |
| framework_end | date | nullable |
| framework_indefinite | bool | |
| has_service_contract | bool | |
| service_pdf_url | text | |
| service_start | date | |
| service_end | date | nullable |
| service_indefinite | bool | |
| purchase_orders_url | text | |

**`hourly_rates`**
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| account_id | uuid FK accounts | |
| year | int | |
| role | text | |
| rate | numeric | |

Unique constraint: `(account_id, year, role)`

**`sla_rates`**
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| account_id | uuid FK accounts | |
| year | int | |
| fixed_monthly_rate | numeric | |
| support_hourly_rate | numeric | |

Unique constraint: `(account_id, year)`

**`sla_tools`**
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| sla_rate_id | uuid FK sla_rates | |
| tool_name | text | |
| monthly_price | numeric | |

**`indexation_indices`**
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| name | text | e.g. "Agoria", "Agoria Digital" |
| value | numeric | e.g. 3.1, 2.8 |

Reference data for quick-select indexation percentages in the simulator. Admin-configurable.

**`indexation_config`**
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| account_id | uuid FK accounts | 1:1 |
| indexation_type | text | |
| start_month | int | |
| start_year | int | |

**`indexation_drafts`**
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| account_id | uuid FK accounts | |
| target_year | int | |
| base_year | int | |
| percentage | numeric | |
| status | text | draft / approved / rejected |
| info | text | |
| adjustment_pct_hourly | numeric | nullable |
| adjustment_pct_sla | numeric | nullable |
| created_by | uuid FK user_profiles | |
| approved_by | uuid FK user_profiles | nullable |

**`indexation_draft_rates`**
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| draft_id | uuid FK indexation_drafts | |
| role | text | |
| current_rate | numeric | |
| proposed_rate | numeric | |

**`indexation_draft_sla`**
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| draft_id | uuid FK indexation_drafts | 1:1 |
| fixed_monthly_rate | numeric | |
| support_hourly_rate | numeric | |

**`indexation_draft_sla_tools`**
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| draft_id | uuid FK indexation_drafts | |
| tool_name | text | |
| proposed_price | numeric | |

**`indexation_history`**
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| account_id | uuid FK accounts | |
| date | date | |
| target_year | int | |
| percentage | numeric | |
| scenario | text | |
| info | text | |
| adjustment_pct_hourly | numeric | nullable |
| adjustment_pct_sla | numeric | nullable |

**`indexation_history_rates`**
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| history_id | uuid FK indexation_history | |
| role | text | |
| rate | numeric | |

**`indexation_history_sla`**
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| history_id | uuid FK indexation_history | 1:1 |
| fixed_monthly_rate | numeric | |
| support_hourly_rate | numeric | |

**`indexation_history_sla_tools`**
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| history_id | uuid FK indexation_history | |
| tool_name | text | |
| price | numeric | |

### 4.5 Finance

**`divisions`**
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| name | text | e.g. "25Carat", "PHPro" |
| color | text | hex color for UI |
| sort_order | int | |

**`division_services`**
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| division_id | uuid FK divisions | |
| service_name | text | e.g. "OroCommerce", "Magento", "Consultancy" |
| sort_order | int | |

**`revenue_clients`**
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| name | text | e.g. "Belcolor", "Nordex Group" |
| account_id | uuid FK accounts | nullable, links to CRM account if applicable |

**`revenue_client_divisions`**
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| revenue_client_id | uuid FK revenue_clients | |
| division_id | uuid FK divisions | |

**`revenue_client_services`**
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| revenue_client_id | uuid FK revenue_clients | |
| division_id | uuid FK divisions | |
| service_name | text | |

**`revenue_entries`**
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| revenue_client_id | uuid FK revenue_clients | |
| division_id | uuid FK divisions | |
| service_name | text | |
| year | int | |
| month | int | 0-11 |
| amount | numeric | |

Unique constraint: `(revenue_client_id, division_id, service_name, year, month)`

Monthly granularity supports the Revenue page (drill down by month), Prognose editor (yearly aggregates with monthly breakdown for display), and Pipeline analytics.

**`account_revenue`**
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| account_id | uuid FK accounts | |
| year | int | |
| category | text | |
| amount | numeric | |
| notes | text | |

This is the per-account "Omzet" tab — separate from the cross-client revenue tracking above. Tracks revenue by category (e.g. "Consultancy", "Adobe Commerce", "Hyva") per account per year.

**`pipeline_entries`**
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| deal_id | uuid FK deals | nullable |
| client | text | |
| division_id | uuid FK divisions | |
| service_name | text | |
| sold_month | int | 0-11 |
| start_month | int | 0-11 |
| duration | int | months |
| total | numeric | |
| year | int | pipeline year |

Standalone editable data: won deals broken into monthly pipeline entries. Not directly computed from deals — manually entered/adjusted.

### 4.6 HR

**`employees`**
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| first_name | text | |
| last_name | text | |
| date_of_birth | date | |
| city | text | |
| nationality | text | |
| education | text | |
| school | text | |
| marital_status | text | |
| emergency_contact_name | text | |
| emergency_contact_phone | text | |
| emergency_contact_relation | text | |
| hire_date | date | |
| termination_date | date | nullable |
| job_title | text | |
| department | text | |
| status | text | actief / inactief |
| gross_salary | numeric | |
| email | text | |
| phone | text | |
| notes | text | |

**`employee_children`**
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| employee_id | uuid FK employees | |
| name | text | |
| birth_year | int | |

**`salary_history`**
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| employee_id | uuid FK employees | |
| date | date | |
| gross_salary | numeric | |
| reason | text | |
| recorded_by | uuid FK user_profiles | |

**`equipment`**
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| employee_id | uuid FK employees | |
| type | text | |
| name | text | |
| serial_number | text | |
| date_issued | date | |
| date_returned | date | nullable |
| notes | text | |

**`hr_documents`**
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| employee_id | uuid FK employees | |
| type | text | |
| name | text | |
| url | text | |
| date | date | |

**`leave_balances`**
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| employee_id | uuid FK employees | |
| year | int | |
| allowance | int | |
| taken | int | |

Unique constraint: `(employee_id, year)`

**`evaluations`**
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| employee_id | uuid FK employees | |
| date | date | |
| type | text | |
| score | text | |
| notes | text | |
| recorded_by | uuid FK user_profiles | |

## 5. ACL & Roles

### 5.1 Roles

| Role | Description |
|---|---|
| `admin` | Full access to everything |
| `sales_manager` | Full CRM + consultancy + revenue/pipeline read. Can approve indexation drafts. |
| `sales_rep` | CRM read/write on own accounts & deals. No HR, no indexation approval. |
| `customer_success` | Read all CRM. Write communications & activities. No deals write, no HR. |
| `marketing` | Read accounts/contacts/deals. No write, no HR, no consultancy. |

### 5.2 Permissions

```
dashboard.read
accounts.read / accounts.write / accounts.delete
contacts.read / contacts.write / contacts.delete
deals.read / deals.write / deals.delete
activities.read / activities.write
tasks.read / tasks.write
communications.read / communications.write
consultants.read / consultants.write
bench.read / bench.write
contracts.read / contracts.write
indexation.read / indexation.write / indexation.approve
revenue.read / revenue.write
pipeline.read
prognose.read
hr.read / hr.write
equipment.read / equipment.write
files.read / files.write / files.delete
users.read / users.write
settings.read / settings.write
audit.read
notifications.read
```

### 5.3 RLS Strategy

Same pattern as existing — `get_user_role()` SQL function used in policies. Most tables: all authenticated can SELECT, write permissions gated by role. HR tables restricted to `admin` for read and write. No other roles have HR access.

## 6. Navigation & Routing

### 6.1 Sidebar Structure

```
CRM
  /admin/dashboard
  /admin/accounts
  /admin/accounts/[id]
  /admin/accounts/new
  /admin/contacts
  /admin/deals
  /admin/deals/[id]
  /admin/activities
  /admin/tasks

Consultancy
  /admin/bench
  /admin/consultants

HR
  /admin/people
  /admin/people/[id]
  /admin/materials

Analyse
  /admin/revenue
  /admin/prognose
  /admin/pipeline

Settings (bottom)
  /admin/settings
```

Existing routes kept: `/admin/files`, `/admin/notifications`, `/admin/audit`, `/admin/users`, all auth routes.

### 6.2 Key UI Patterns

- **Account detail** — tabbed layout with 6 tabs (Overview, Communicatie, Contracten & Tarieven, Consultants, Contacts, Deals)
- **Deals** — toggle between kanban board and list view, 3 pipelines as top-level tabs
- **Bench** — card grid with detail modals (not separate pages)
- **Indexeringssimulator** — 4-step modal wizard launched from Contracten tab
- **Prognose** — inline editable table with copy/custom/stop per service line
- **People detail** — tabbed layout with 6 tabs (Overview, Loon, Materiaal, Documenten, Verlof, Evaluaties)
- **Dashboard** — stat cards + recent activity + upcoming tasks

## 7. Feature Directory Structure

```
src/features/
  accounts/
    types.ts, queries/, actions/, components/, columns.ts
  contacts/
    types.ts, queries/, actions/, components/, columns.ts
  communications/
    types.ts, queries/, actions/, components/
  deals/
    types.ts, queries/, actions/, components/, columns.ts
  activities/
    types.ts, queries/, actions/, components/, columns.ts
  tasks/
    types.ts, queries/, actions/, components/, columns.ts
  bench/
    types.ts, queries/, actions/, components/
  consultants/
    types.ts, queries/, actions/, components/
  contracts/
    types.ts, queries/, actions/, components/
  indexation/
    types.ts, queries/, actions/, components/
  revenue/
    types.ts, queries/, actions/, components/
  prognose/
    types.ts, queries/, actions/, components/
  pipeline/
    types.ts, queries/, components/
  people/
    types.ts, queries/, actions/, components/
  equipment/
    types.ts, queries/, actions/, components/
  auth/           (existing — keep)
  files/          (existing — keep)
  audit/          (existing — keep)
  notifications/  (existing — keep)
  users/          (existing — keep)
```

Each feature: `types.ts` (Zod schema + derived types), `queries/` (server-side `cache()`-wrapped fetches), `actions/` (server actions with `requirePermission` + `logAction`), `components/` (React), `columns.ts` (DataTable column defs where applicable).

## 8. Shared Components

### 8.1 New Components (`src/components/admin/`)

- **`kanban-board.tsx`** — generic drag-and-drop kanban using `@dnd-kit`. Columns from pipeline stages, cards are deal summaries.
- **`rich-text-editor.tsx`** — Plate editor wrapper, configured with bold/italic/lists/links.
- **`chip-select.tsx`** — multi-select with autocomplete suggestions (technologies, hobbies, roles, languages).
- **`pdf-upload-field.tsx`** — file input that uploads to Supabase Storage, returns URL.
- **`health-bar.tsx`** — colored progress bar (green/yellow/red) for account health scores.
- **`info-row.tsx`** — label/value display row with optional icon.
- **`section-card.tsx`** — titled card with icon header.
- **`modal.tsx`** — generic modal wrapper (standard, wide, extra-wide sizes).
- **`currency-input.tsx`** — EUR-formatted number input.

### 8.2 New Dependencies

- `next-intl` — i18n
- `@platejs/core`, `@platejs/basic-nodes`, etc. — Plate rich text editor
- `@dnd-kit/core`, `@dnd-kit/sortable` — kanban drag-and-drop

### 8.3 Existing Components Reused

- `data-table.tsx`, `entity-form.tsx`, `confirm-dialog.tsx`, `stat-card.tsx`, `page-header.tsx`

## 9. Business Logic

### 9.1 Indexeringssimulator (Server-Side Workflow)

4-step process, each step is a server action:

1. **Configure** — select target year, set base percentage. Quick-select buttons (1.5–4%) or custom input.
2. **Simulate** — server action takes `account_id` + `percentage`, reads current `hourly_rates` + `sla_rates` for latest year, returns projected rates. Read-only.
3. **Negotiate** — creates/updates `indexation_draft` with status `draft`. Per-role overrides for hourly rates, per-field overrides for SLA. Separate adjustment percentages. Saveable and resumable.
4. **Approve** — requires `indexation.approve` permission (admin/sales_manager only). Writes new `hourly_rates` + `sla_rates` rows, logs to `indexation_history`, deletes draft. Irreversible.

### 9.2 Contract Status Calculation

Server-side computed based on contract dates:
- `stopgezet` — consultant explicitly stopped
- `onbepaald` — no end date set
- `verlopen` — end date in the past
- `kritiek` — end date within 60 days
- `waarschuwing` — end date within 120 days
- `actief` — everything else

### 9.3 Revenue Calculations

- **Consultant revenue**: `hourly_rate × 8 × working_days(start, end)` (excludes weekends)
- **Contact date**: `end_date - notice_period - 30 days`
- **Effective tariff**: most recent `consultant_rate_history` entry
- **Effective services**: manual services + auto-added "Consultancy" if account has active consultants

### 9.4 Revenue Tracking

The Revenue page is a multi-dimensional data viewer: `client → division → service → year → month[]`. Data comes from `revenue_entries` (monthly granularity). Two view modes:

- **Client view** — rows are clients, expandable to show division/service breakdown. Columns are months + year total.
- **Service view** — rows are services grouped by division, with client breakdown underneath.

Supports year selection, division filtering, time view toggle (months vs quarters), and client selection checkboxes.

### 9.5 Prognose Editor

Per service line per client, client-side interactive. Data structure: `client → division → service` with history years for reference.

Per service line:
- **Copy (Zelfde)** — carry forward last known year's total
- **Custom (Aanpassen)** — enter different amount, click-to-edit inline
- **Stop (Gestopt)** — set to €0, shown with strikethrough
- **Add new** — modal to add a new division+service line for a client

Summary cards show: total forecast, last known year, consultancy subtotal. Separate tables for services vs consultancy. Final forecast saved as `revenue_entries` for the forecast year.

### 9.6 Pipeline Analytics

Standalone editable data grid — NOT computed from deals. Each row represents a sold deal entry with: client, division, service, sold month, start month, duration, total amount.

Features:
- Add/edit/delete pipeline entries via form
- Data stored in `pipeline_entries` table
- Grouped display by division, then by client within each division
- Monthly spread: total is distributed across months from `start_month` for `duration` months
- Summary rows per division and grand total
- Stat cards: total sold, per-division totals

### 9.6 Dashboard

Stat cards: total open deal value (weighted by probability), active consultants count, high-priority bench count, YoY revenue, upcoming activities (7 days), overdue tasks.

## 10. i18n Strategy

### 10.1 Structure

```
messages/
  nl.json
  en.json
```

Organized by feature namespace: `common`, `nav`, `accounts`, `deals`, `consultants`, `hr`, `indexation`, etc.

### 10.2 Implementation

- `next-intl` middleware for locale detection from cookie/header, default `nl`
- Server components: `getTranslations('namespace')`
- Client components: `useTranslations('namespace')`
- Locale switcher in topbar (NL/EN toggle)
- Domain terms stay Dutch in both locales where they're the natural business term (e.g. "Raamcontract", "Bestelbonnen", "Indexering")
- Enum/status values stored in locale-neutral keys in DB (e.g. `won`, `lost`), translated at render time

## 11. Seed Data

Ported from demo's `seed.ts` into `supabase/seed.sql` + auth seed script:

- 3 accounts (TechVision NV, GreenLogistics BV, MediCare Plus) with full contract/SLA data
- 4 contacts with roles and personal info
- 5 deals across 3 pipeline types
- 4 activities, 2 tasks
- 3 bench consultants with languages/technologies
- 3 active consultants with rate history
- Revenue entries (multi-year, multi-category)
- 3 pipelines with 22 stages total
- 2 divisions (25Carat, PHPro) with their service catalogs
- 10 revenue clients (Belcolor, Nordex Group, Solavio, etc.) with division/service mappings
- Revenue entries (generated, 4 years × 12 months per client/service)
- Indexation indices (Agoria: 3.1%, Agoria Digital: 2.8%)
- 4 employees with salary history, materials, documents, leave, evaluations
- 5 users: Jan (admin), Sophie (sales_manager), Pieter (sales_rep), Emma (customer_success), Lien (marketing)

## 12. Implementation Layers

### Layer 1 — Foundation
- Remove old contacts feature + demo pages
- next-intl setup (NL/EN, locale switcher)
- Updated roles (5) and permissions (30+)
- Sidebar restructured (4 sections)
- Pipelines + stages tables + seed
- Plate editor shared component
- Shared components (kanban, chip-select, modal, etc.)
- Dependency installs (@dnd-kit, next-intl, plate)

### Layer 2 — Core CRM
- Accounts (list with configurable columns, detail with 6 tabs, create/edit modal)
- Contacts (linked to accounts, personal info, cross-account list)
- Communications (per-account tab, Plate rich text, linked to deals/contacts)
- ~15 tables

### Layer 3 — Sales
- Deals (3 pipeline tabs, kanban + list toggle, detail, close flow, QuickDealModal)
- Activities (list, modal create/edit, linked to deals/accounts)
- Tasks (list, modal create/edit, priority/status/assignee)
- Dashboard (stat cards, recent activity, upcoming tasks)
- ~3 tables

### Layer 4 — Consultancy
- Bench (card grid, detail/create/edit/archive modals, koppel-aan-deal)
- Active consultants (cross-account list, detail/verlenging/stopzetting/tariefwijziging modals)
- Contracts tab (raamcontract, service contract, PDF upload)
- Hourly rates (view + edit, 3-year sliding window)
- SLA rates (view + edit, tools management)
- Indexeringssimulator (4-step server workflow, drafts, approval)
- Indexering history
- ~18 tables

### Layer 5 — Finance
- Divisions + division services (reference data)
- Revenue clients + client-division-service mappings
- Revenue entries (monthly granularity per client/division/service)
- Revenue page (client view + service view, year/division/time filters)
- Account revenue (OmzetTab — per account/year/category)
- Prognose editor (interactive forecast table with copy/custom/stop)
- Pipeline entries (standalone editable grid, monthly spread)
- Pipeline analytics page (grouped by division/client, stat cards)
- ~8 tables: divisions, division_services, revenue_clients, revenue_client_divisions, revenue_client_services, revenue_entries, account_revenue, pipeline_entries

### Layer 6 — HR
- Employees (list, detail with 6 tabs)
- Salary history, Equipment/materials, HR documents, Leave balances, Evaluations
- ~7 tables
