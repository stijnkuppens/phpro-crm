# Codebase Structure

**Analysis Date:** 2026-03-20

## Directory Layout

```
phpro-crm/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/             # Auth route group (login, register, password reset)
│   │   ├── (public)/           # Public route group (static pages)
│   │   ├── admin/              # Admin routes (protected, role-gated)
│   │   │   ├── accounts/       # Account list and detail pages
│   │   │   ├── contacts/       # Contact management
│   │   │   ├── deals/          # Deal pipeline
│   │   │   ├── activities/     # Activity log
│   │   │   ├── tasks/          # Task management
│   │   │   ├── people/         # HR/employee management
│   │   │   ├── materials/      # Equipment/materials
│   │   │   ├── bench/          # Bench (unused resources)
│   │   │   ├── consultants/    # Consultant management
│   │   │   ├── revenue/        # Revenue tracking
│   │   │   ├── pipeline/       # Sales pipeline
│   │   │   ├── prognose/       # Forecasting
│   │   │   ├── audit/          # Audit log viewer
│   │   │   ├── files/          # File management
│   │   │   ├── notifications/  # Notification center
│   │   │   ├── users/          # User management
│   │   │   ├── settings/       # Settings
│   │   │   ├── page.tsx        # Admin dashboard
│   │   │   ├── layout.tsx      # Admin layout (sidebar, topbar)
│   │   │   ├── error.tsx       # Admin error boundary
│   │   │   └── loading.tsx     # Admin page skeleton
│   │   ├── api/
│   │   │   ├── admin/          # Admin API endpoints
│   │   │   └── webhooks/       # External webhook handlers
│   │   ├── layout.tsx          # Root layout (theme, intl, providers)
│   │   ├── globals.css         # Global styles
│   │   └── not-found.tsx       # 404 page
│   │
│   ├── features/               # Feature modules (domain-driven)
│   │   ├── accounts/
│   │   │   ├── actions/        # Server actions (mutations)
│   │   │   │   ├── create-account.ts
│   │   │   │   ├── update-account.ts
│   │   │   │   ├── delete-account.ts
│   │   │   │   └── search-accounts.ts
│   │   │   ├── queries/        # Server queries (wrapped in React.cache)
│   │   │   │   ├── get-accounts.ts
│   │   │   │   └── get-account.ts
│   │   │   ├── components/     # Feature components
│   │   │   │   ├── account-list.tsx
│   │   │   │   ├── account-detail.tsx
│   │   │   │   ├── account-form.tsx
│   │   │   │   └── account-filters.tsx
│   │   │   ├── types.ts        # Zod schemas + TypeScript types
│   │   │   └── columns.tsx     # TanStack Table column definitions
│   │   │
│   │   ├── contacts/           # (Same structure as accounts)
│   │   ├── deals/
│   │   ├── activities/
│   │   ├── tasks/
│   │   ├── people/             # HR/employee module
│   │   │   ├── components/
│   │   │   │   ├── employee-list.tsx
│   │   │   │   ├── employee-detail.tsx
│   │   │   │   ├── employee-overview-tab.tsx
│   │   │   │   ├── employee-leave-tab.tsx
│   │   │   │   ├── employee-evaluations-tab.tsx
│   │   │   │   ├── employee-salary-tab.tsx
│   │   │   │   ├── employee-documents-tab.tsx
│   │   │   │   └── employee-equipment-tab.tsx
│   │   │   ├── actions/
│   │   │   └── queries/
│   │   │
│   │   ├── equipment/          # Equipment/materials (views only, no mutations)
│   │   │   └── queries/
│   │   │
│   │   ├── audit/              # Audit logging
│   │   │   ├── actions/
│   │   │   │   └── log-action.ts
│   │   │   ├── queries/
│   │   │   └── components/
│   │   │
│   │   ├── auth/               # Authentication
│   │   │   ├── queries/
│   │   │   │   ├── get-current-user.ts
│   │   │   │   └── get-user-role.ts
│   │   │   └── components/
│   │   │       ├── login-form.tsx
│   │   │       ├── register-form.tsx
│   │   │       └── password-reset-form.tsx
│   │   │
│   │   ├── notifications/
│   │   ├── files/              # File upload and management
│   │   │   ├── hooks/
│   │   │   │   └── use-file-upload.ts
│   │   │   ├── actions/
│   │   │   ├── queries/
│   │   │   └── components/
│   │   │
│   │   ├── users/              # User management
│   │   ├── bench/              # Bench (resource allocation)
│   │   ├── consultants/        # Consultant management
│   │   ├── communications/     # Communications/messaging
│   │   ├── contracts/          # Contract management
│   │   ├── dashboard/          # Dashboard widgets
│   │   ├── indexation/         # Salary indexation
│   │   ├── pipeline/           # Sales pipeline
│   │   ├── prognose/           # Forecasting
│   │   ├── revenue/            # Revenue tracking
│   │   └── tasks/              # Task management
│   │
│   ├── lib/                    # Shared utilities
│   │   ├── supabase/
│   │   │   ├── server.ts       # Server-side Supabase client
│   │   │   ├── client.ts       # Browser-side Supabase client
│   │   │   └── admin.ts        # Admin Supabase client (bypasses RLS)
│   │   ├── hooks/              # Shared hooks
│   │   │   ├── use-entity.ts   # Generic CRUD + pagination
│   │   │   ├── use-realtime.ts # Real-time subscriptions
│   │   │   ├── use-auth.ts     # Auth state + role
│   │   │   └── use-file-upload.ts
│   │   ├── acl.ts              # Access Control List (roles/permissions)
│   │   ├── action-result.ts    # Server action return type (ok/err)
│   │   ├── require-permission.ts  # Permission guard for actions
│   │   ├── business-logic.ts   # Shared business logic utilities
│   │   ├── env.ts              # Environment variable validation
│   │   ├── format.ts           # String formatting utilities
│   │   └── utils.ts            # Generic utilities (cn, etc.)
│   │
│   ├── components/             # Reusable UI components
│   │   ├── admin/              # Admin-specific components
│   │   │   ├── data-table.tsx  # Paginated TanStack Table wrapper
│   │   │   ├── page-header.tsx # Page title + breadcrumbs + actions
│   │   │   ├── modal.tsx
│   │   │   ├── confirm-dialog.tsx
│   │   │   ├── entity-form.tsx
│   │   │   ├── file-upload.tsx
│   │   │   ├── stat-card.tsx
│   │   │   ├── kanban-board.tsx
│   │   │   ├── error-boundary.tsx
│   │   │   └── ... (other admin components)
│   │   │
│   │   ├── layout/             # Global layout components
│   │   │   ├── sidebar.tsx
│   │   │   ├── topbar.tsx
│   │   │   └── theme-toggle.tsx
│   │   │
│   │   └── ui/                 # shadcn/ui primitives
│   │       ├── button.tsx
│   │       ├── input.tsx
│   │       ├── card.tsx
│   │       ├── table.tsx
│   │       ├── pagination.tsx
│   │       └── ... (other primitives)
│   │
│   ├── types/
│   │   ├── database.ts         # Generated Supabase types
│   │   └── acl.ts              # Role and permission types
│   │
│   ├── i18n/                   # Internationalization
│   │   └── request.ts          # i18n configuration
│   │
│   └── proxy.ts                # Route protection & auth middleware
│
├── supabase/                   # Supabase schema and data
│   ├── migrations/             # Schema migrations (numbered 001_, 002_, etc.)
│   ├── data/                   # Production reference data (idempotent)
│   ├── fixtures/               # Demo/test data (dev only)
│   └── seed.sql                # Orchestrator (runs data/ + fixtures/)
│
├── package.json
├── tsconfig.json
├── next.config.ts
└── components.json             # shadcn/ui configuration
```

## Directory Purposes

**src/app/:**
- **Purpose:** Next.js App Router — routes, layouts, error boundaries
- **Contains:** Server components (pages), route groups, API handlers
- **Key patterns:** Async page components call feature queries, render feature components; generateMetadata for SEO; error.tsx and loading.tsx per route

**src/features/:**
- **Purpose:** Domain-driven modules; self-contained features with all their code
- **Contains:** Each subdirectory is a feature (accounts, contacts, deals, etc.)
- **Key rules:** No barrel files (import directly from file); feature-specific components stay here, not in src/components; each feature has actions/, queries/, components/, types.ts, and optionally columns.tsx

**src/lib/:**
- **Purpose:** Cross-cutting concerns and shared utilities
- **Contains:** Supabase clients, hooks, ACL system, action result wrapper, environment variables
- **Key patterns:** Utilities used by multiple features; feature-specific code goes in feature folders, not here

**src/components/:**
- **Purpose:** Reusable UI components (admin patterns, layout, shadcn primitives)
- **Contains:** admin/ (data-table, page-header, modal), layout/ (sidebar, topbar), ui/ (shadcn/ui)
- **Key rule:** Components only used by one feature go in features/<name>/components/, not here

**supabase/:**
- **Purpose:** Database schema and data management
- **Subdirectories:**
  - `migrations/`: DDL (CREATE TABLE, ALTER, triggers, RLS policies, GRANT). Never INSERT data.
  - `data/`: Production reference data. Idempotent, runs in all environments.
  - `fixtures/`: Demo/test data. Idempotent, dev/staging only, never production.
  - `seed.sql`: Orchestrator — runs migrations, data/, and fixtures/.

## Key File Locations

**Entry Points:**

- `src/app/layout.tsx`: Root layout (theme provider, intl, Toaster)
- `src/app/admin/page.tsx`: Admin dashboard
- `src/app/admin/<name>/page.tsx`: Feature list page (fetches data, renders list component)
- `src/app/admin/<name>/[id]/page.tsx`: Feature detail page (fetches single record, renders detail component, exports generateMetadata)
- `src/app/(auth)/login/page.tsx`: Login entry point
- `src/proxy.ts`: Automatic route protection and permission checks

**Configuration:**

- `src/proxy.ts`: Route-to-permission mappings and route guards
- `src/lib/acl.ts`: Role definitions and role-to-permissions mappings
- `src/lib/env.ts`: Server and client env var validation
- `src/types/acl.ts`: Role and Permission TypeScript types
- `src/types/database.ts`: Generated Supabase types (auto-generated from supabase db)

**Core Logic:**

- `src/lib/supabase/server.ts`: Supabase client for server components and actions
- `src/lib/supabase/client.ts`: Supabase client for browser (singleton)
- `src/lib/supabase/admin.ts`: Supabase admin client (bypasses RLS for audits)
- `src/lib/action-result.ts`: ActionResult<T> type and ok/err helpers
- `src/lib/require-permission.ts`: Permission guard for server actions

**Testing:**

- No test directory detected — tests would follow `src/features/<name>/*.test.ts` or `src/features/<name>/*.spec.ts` pattern

## Naming Conventions

**Files:**

- `kebab-case.tsx` for components and pages: `account-list.tsx`, `create-account.ts`
- `kebab-case.ts` for utilities and hooks: `get-accounts.ts`, `use-entity.ts`
- Actions: `create-<name>.ts`, `update-<name>.ts`, `delete-<name>.ts`, `search-<name>.ts`
- Queries: `get-<name>.ts` (singular for detail), `get-<names>.ts` (plural for list)
- Hooks: `use-<pattern>.ts` matching React conventions
- Components: PascalCase exports but kebab-case filenames: `account-list.tsx` exports `function AccountList`

**Directories:**

- Feature modules: `src/features/<domain>/` (plural: accounts, contacts, deals)
- Route parameters: `[id]` (singular): `src/app/admin/accounts/[id]/`
- Route groups: `(auth)`, `(public)` — not shown in URL, for grouping related routes

**Components:**

- Page components: `default export`, async when server component
- Feature components: `named export`, 'use client' if interactive
- Admin components: `named export`, composable building blocks
- Primitives: `default export` from shadcn/ui

**Server Actions:**

- Named exports, camelCase: `createAccount`, `updateContact`, `deleteTask`
- File naming: `<verb>-<entity>.ts`: `create-account.ts`, not `account-create.ts`

**Type Names:**

- Database row types: `Account`, `Contact`, `Deal`
- Extended types: `AccountWithRelations`, `ContactWithDetails`
- Form value types: `AccountFormValues`, `ContactFormValues`
- List item types: `AccountListItem`, `ContactListItem`
- Filter types: `AccountFilters`, `ContactFilters`
- Query param types: `GetAccountsParams`, `SearchContactsParams`

## Where to Add New Code

**New Feature (e.g., "Projects"):**

1. Create directory: `src/features/projects/`
2. Add subdirectories: `actions/`, `queries/`, `components/`, and files `types.ts`, `columns.tsx`
3. Add migration: `supabase/migrations/00XXX_create_projects_table.sql` (with GRANT statements)
4. Add production data if needed: `supabase/data/00XXX_projects_reference_data.sql` (idempotent)
5. Add demo data if needed: `supabase/fixtures/00XXX_projects_demo_data.sql` (idempotent)
6. Add routes: `src/app/admin/projects/page.tsx` (list) and `src/app/admin/projects/[id]/page.tsx` (detail)
7. Add routes to proxy: `src/proxy.ts` (add route-permission entry)
8. Add permissions to ACL: `src/lib/acl.ts` (define which roles can access)
9. Update `src/types/acl.ts` if new permission types needed

**Primary code location:** `src/features/<name>/`
**Tests location:** `src/features/<name>/*.test.ts` (co-located with code)

**New Page Component:**

- If it's a feature page, keep it minimal: fetch data, render feature component
- If it's custom admin UI not belonging to a feature, put reusable parts in `src/components/admin/`

**New Shared Component:**

- If used by one feature only: `src/features/<name>/components/`
- If used by multiple features: `src/components/admin/` (only if admin-specific) or `src/components/ui/` (if generic)
- Never create barrel files (`index.ts` exports); import directly from file paths

**New Utility Function:**

- Cross-feature utility: `src/lib/<category>.ts` (e.g., `format.ts`, `business-logic.ts`)
- Feature-specific helper: `src/features/<name>/<helper>.ts`
- Shared hook: `src/lib/hooks/use-<pattern>.ts`
- Feature-specific hook: `src/features/<name>/hooks/use-<pattern>.ts`

**New Server Action:**

- Location: `src/features/<name>/actions/<verb>-<entity>.ts`
- Template:
  ```typescript
  'use server';
  import { requirePermission } from '@/lib/require-permission';
  import { ok, err } from '@/lib/action-result';
  export async function createEntity(values: FormValues): Promise<ActionResult<{ id: string }>> {
    const { userId } = await requirePermission('entities.write');
    const parsed = schema.safeParse(values);
    if (!parsed.success) return err(parsed.error.flatten().fieldErrors);
    // ... mutation ...
    await logAction({ action: 'entity.created', entityType: 'entity', entityId });
    revalidatePath('/admin/entities');
    return ok(data);
  }
  ```

**New Query:**

- Location: `src/features/<name>/queries/get-<names>.ts`
- Template:
  ```typescript
  import { cache } from 'react';
  import { createServerClient } from '@/lib/supabase/server';
  export const getEntities = cache(async (params?: { filters?, page?, pageSize? }) => {
    const supabase = await createServerClient();
    // ... fetch with React.cache wrapping ...
    return { data, count };
  });
  ```

**New Type Schema:**

- Location: `src/features/<name>/types.ts`
- Template:
  ```typescript
  import { z } from 'zod';
  export type Entity = Database['public']['Tables']['entities']['Row'];
  export const entityFormSchema = z.object({ /* fields */ });
  export type EntityFormValues = z.infer<typeof entityFormSchema>;
  export type EntityListItem = { /* fields for list display */ };
  export type EntityFilters = { /* filter fields */ };
  ```

## Special Directories

**src/app/(auth)/:**
- **Purpose:** Authentication routes (login, register, password reset)
- **Generated:** No
- **Committed:** Yes
- **Pattern:** Route group not shown in URL, contains auth-specific pages

**src/app/(public)/:**
- **Purpose:** Public static pages (no auth required)
- **Generated:** No
- **Committed:** Yes
- **Pattern:** Dynamic slug route [slug] for flexible public content

**supabase/migrations/:**
- **Purpose:** Database schema versions (DDL only)
- **Generated:** No (manual SQL files)
- **Committed:** Yes
- **Pattern:** Numbered sequentially (001_, 002_, etc.), immutable, never deleted

**supabase/data/:**
- **Purpose:** Production reference data (small lookup tables, initial settings)
- **Generated:** No
- **Committed:** Yes
- **Pattern:** Idempotent (use ON CONFLICT DO NOTHING), runs in all environments

**supabase/fixtures/:**
- **Purpose:** Demo and test data (large sample datasets)
- **Generated:** No
- **Committed:** Yes
- **Pattern:** Idempotent, dev/staging only, never in production (conditional in seed.sql)

**src/types/database.ts:**
- **Purpose:** Generated Supabase TypeScript types (auto-generated from DB schema)
- **Generated:** Yes (via `npm run types:generate`)
- **Committed:** Yes (source-controlled, regenerate when schema changes)
- **Pattern:** Never manually edit; regenerate after migrations run

---

*Structure analysis: 2026-03-20*
