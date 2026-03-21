# Research: Unified Consultants

## Understanding
Merge two separate consultant tables (bench_consultants + active_consultants) into one `consultants` table with status-based lifecycle. Single DataTable view replaces two separate pages.

## Codebase Analysis

### Current Schema

**bench_consultants (migration 00022):**
- id, first_name, last_name, city, priority (High/Medium/Low), available_date
- min_hourly_rate, max_hourly_rate, roles[], technologies[], description, cv_pdf_url
- is_archived (soft delete for linked consultants)
- Child: bench_consultant_languages (language, level)
- Referenced by: deals.bench_consultant_id (FK, ON DELETE SET NULL)

**active_consultants (migration 00023):**
- id, account_id (FK→accounts), first_name, last_name, role, city, cv_pdf_url
- is_active, client_name (denormalized), client_city
- start_date, end_date, is_indefinite, hourly_rate, sow_url, notice_period_days, notes
- is_stopped, stop_date, stop_reason
- Children: consultant_rate_history, consultant_extensions, consultant_contract_attributions

**RPC function:** link_bench_to_account() (migration 00062) — atomic: creates active record, initial rate history, archives bench.

### Unified Table Design

New `consultants` table combines all columns:
- **Shared:** id, first_name, last_name, city, cv_pdf_url, created_at, updated_at
- **Status:** status ('bench' | 'actief' | 'stopgezet') replaces is_active, is_stopped, is_archived
- **Bench-specific (nullable):** priority, available_date, min_hourly_rate, max_hourly_rate, roles[], technologies[], description
- **Active-specific (nullable):** account_id, role, client_name, client_city, start_date, end_date, is_indefinite, hourly_rate, sow_url, notice_period_days, notes
- **Stop-specific (nullable):** stop_date, stop_reason

Child table FKs rename: bench_consultant_id / active_consultant_id → consultant_id.
deals.bench_consultant_id → deals.consultant_id.

### RLS Differences
- Bench: sales_rep can INSERT/UPDATE
- Active: only sales_manager can INSERT/UPDATE
- **Decision:** Unify to sales_manager for write operations (bench creation is a manager activity in this CRM). Or keep status-based: bench writes allow sales_rep, active writes require sales_manager. Simpler: single consultants.write permission, handle in app layer.

### File Inventory

**Files to DELETE:**
- src/features/bench/ (entire directory — merged into consultants)
- src/app/admin/bench/ (entire directory — route removed)
- supabase/migrations/00022_bench_consultants.sql (replaced by new migration)

**Files to HEAVILY MODIFY:**
- src/features/consultants/types.ts — unified type with status discriminator
- src/features/consultants/queries/ — single query replacing two
- src/features/consultants/actions/ — consolidate, adapt link/stop/move logic
- src/features/consultants/components/consultant-list.tsx — unified DataTable with status badges/filters
- src/features/consultants/columns.tsx — new columns for status, bench-specific info
- src/features/consultants/components/link-consultant-wizard.tsx — adapt to unified table
- src/features/consultants/components/account-consultants-tab.tsx — remove "Manueel toevoegen"
- src/app/admin/consultants/page.tsx — fetch unified data
- src/app/admin/accounts/[id]/page.tsx — remove bench fetch, adapt consultant fetch

**Files to CREATE:**
- New migration: merge tables, migrate data, update FKs, drop old tables
- src/features/consultants/components/bench-form.tsx — creation/edit form (from bench feature)
- Updated fixture: 004_consultancy.sql for unified table

**Files to LIGHTLY MODIFY:**
- src/features/consultants/components/stop-consultant-modal.tsx — stop sets status='stopgezet'
- src/features/consultants/components/consultant-detail-modal.tsx — adapt for all statuses
- src/features/consultants/actions/move-stopped-to-bench.ts — just update status to 'bench'

### Reference Implementation
- Existing bench-form.tsx has the right field layout (2-col, language rows)
- Existing PdfUploadField component for CV upload
- Existing AvatarUpload component for profile photos
- useEntity hook for DataTable with server-side filtering
- FilterBar component for consistent filter styling

### Existing File Upload Components
- `useFileUpload` hook — generic validation + upload
- `AvatarUpload` — image upload with camera overlay (JPG/PNG/WebP, 2MB)
- `PdfUploadField` — lightweight single-document upload field
- `FileUpload` — drag-and-drop with progress bar

## Gotchas & Risks
- **Data migration order matters:** Must create new table, migrate data, update FKs, drop old tables — all in one migration
- **link_bench_to_account() RPC:** Currently creates new record. After merge, it should UPDATE the existing consultant row (status bench→actief, populate active fields). Simpler as a server action than RPC.
- **deals.bench_consultant_id FK:** Must be renamed to consultant_id and re-pointed
- **Fixture IDs:** Bench and active use different ID patterns. After merge, need stable IDs for fixtures
- **bench_consultant_languages FK:** Rename to consultant_id, keep CASCADE
- **Permission model:** Currently split (bench.write vs consultants.write). Unify to consultants.write
- **Audit events:** Rename bench_consultant.* events to consultant.* with status context
- **Realtime:** Both tables in publication — need to update to single table
