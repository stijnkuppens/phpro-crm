# Architecture

**Analysis Date:** 2026-03-20

## Pattern Overview

**Overall:** Next.js server-first feature module architecture with role-based access control

**Key Characteristics:**
- Server-driven data flow: pages fetch data, pass as props to client components (eliminate waterfalls)
- Feature modules: each domain (`accounts`, `contacts`, `deals`, etc.) is a self-contained unit with actions/queries/components/types
- Role-based access control (RBAC) enforced at proxy layer (route permissions) and action layer (permission guards)
- Server actions for all mutations (no REST API, use `'use server'` directly)
- Zod schema validation on both client and server sides
- React.cache() wrapping all queries for per-request deduplication

## Layers

**Proxy/Auth Layer:**
- Purpose: Route protection and role-based access enforcement
- Location: `src/proxy.ts`
- Contains: Route-to-permission mappings, auth middleware, role checks
- Depends on: Supabase auth, user_profiles table
- Used by: Next.js automatically via proxy config in next.config.ts

**Feature Module Layer:**
- Purpose: Domain-specific business logic and UI
- Location: `src/features/<name>/`
- Contains: Actions (mutations), queries (reads), components (UI), types (schemas), columns (table defs)
- Depends on: Supabase clients, lib utilities, other features (e.g., audit logging)
- Used by: Page components in `src/app/admin/`

**Shared Library Layer:**
- Purpose: Cross-cutting utilities and hooks
- Location: `src/lib/`
- Contains: Supabase clients (server/browser/admin), ACL system, action-result wrapper, hooks (useEntity, useRealtime, useFileUpload)
- Depends on: @supabase/ssr, next, external libraries
- Used by: All features and pages

**Component Layer:**
- Purpose: Reusable UI primitives and admin patterns
- Location: `src/components/`
- Subdirectories:
  - `admin/`: Data table, modal, confirm dialog, entity form, file upload, page header, stat card, etc.
  - `layout/`: Global navigation, sidebar, topbar
  - `ui/`: shadcn/ui primitives (button, input, card, select, etc.)
- Depends on: React, shadcn/ui, Tailwind, Lucide icons
- Used by: Feature components

**Page Layer:**
- Purpose: Thin wrappers that fetch server-side data and orchestrate feature components
- Location: `src/app/admin/<name>/` and `src/app/admin/<name>/[id]/`
- Contains: Async server components that call queries, render feature components, export generateMetadata
- Depends on: Feature queries and components
- Used by: Next.js routing

## Data Flow

**List View (e.g., Accounts):**

1. User navigates to `/admin/accounts`
2. `src/app/admin/accounts/page.tsx` (server component) executes:
   - Calls `getAccounts()` query (wrapped in React.cache)
   - Calls `getUsers()` in parallel (for filter dropdowns)
   - Passes data as props to `<AccountList initialData={data} initialCount={count} />`
3. `<AccountList>` (client component) renders immediately with initialData
   - No loading state on initial render (server handled it)
   - On user interaction (page change, filter), calls `searchAccounts()` action
4. `searchAccounts()` (server action) executes in isolation:
   - Validates filters
   - Queries Supabase with pagination and filters
   - Returns { data, count } to client
5. Client updates state and re-renders

**Detail View (e.g., Account [id]):**

1. User navigates to `/admin/accounts/:id`
2. `src/app/admin/accounts/[id]/page.tsx` (server component) executes:
   - Calls `getAccount(id)` query
   - Returns notFound() if missing
   - Exports generateMetadata() for dynamic title
   - Renders `<AccountDetail account={data} />`
3. `<AccountDetail>` renders with server-provided data
   - Tabs may have their own queries (passed as props to avoid waterfalls)
   - On edit, calls server action for mutation

**Create/Update Flow:**

1. Form (client component) captures user input
2. On submit, calls server action (e.g., `createAccount()`)
3. Server action:
   - Checks permission via `requirePermission()`
   - Validates with Zod schema
   - Executes mutation
   - Logs to audit table
   - Calls `revalidatePath()` to invalidate cache
   - Returns `ActionResult<T>` (ok/err types)
4. Client receives result and either redirects or shows error
5. Revalidate triggers server component to re-fetch and re-render

**State Management:**

- **Server state**: React.cache() per request, revalidatePath on mutations
- **Client state**: useState in feature components for pagination, filters, UI toggling
- **Browser state**: Supabase session cookies (persisted across requests)
- **Realtime state**: useRealtime hook with optional filtering (INSERT/UPDATE/DELETE events)

## Key Abstractions

**Queries (src/features/*/queries/):**
- Purpose: Fetch data from Supabase with caching per request
- Pattern: `export const getX = cache(async (params) => { /* fetch */ })`
- Example: `src/features/accounts/queries/get-accounts.ts`
- Wrapped in React.cache() for automatic per-request deduplication
- Can be called multiple times in parallel without duplicate DB hits

**Actions (src/features/*/actions/):**
- Purpose: Server-side mutations with validation and audit logging
- Pattern: `'use server'; async function updateX(...) { /* validate, mutate, revalidate */ }`
- Example: `src/features/accounts/actions/create-account.ts`
- Returns ActionResult<T> (not exceptions or { success, error })
- Call `requirePermission()` at start to enforce access control
- Call `revalidatePath()` at end to invalidate cache

**Components (src/features/*/components/):**
- Purpose: Feature-specific UI
- Pattern: Client components that accept initialData props
- Example: `src/features/accounts/components/account-list.tsx`
- Never fetch on mount if server provided data
- Use useEntity hook for client-side pagination/filtering
- Pass cancellation flags to useEffect async operations

**Types (src/features/*/types.ts):**
- Purpose: Zod schemas and TypeScript types
- Pattern: Database row types, extended types with relations, form schemas, filter types
- Example: `src/features/accounts/types.ts`
- Zod schemas validate on both client and server
- Infer TypeScript types from schemas using `z.infer<>`

**Columns (src/features/*/columns.ts):**
- Purpose: TanStack Table column definitions
- Pattern: Array of ColumnDef<T>[] with cell renderers, sorting, visibility
- Example: `src/features/accounts/columns.tsx`
- Used by DataTable component to render list views
- Can include custom cell components for actions, badges, etc.

## Entry Points

**Admin Routes:**
- Location: `src/app/admin/<name>/page.tsx` (list) and `src/app/admin/<name>/[id]/page.tsx` (detail)
- Triggers: User navigation, url routing
- Responsibilities: Fetch data in parallel, call feature queries, render feature components, export metadata

**Auth Routes:**
- Location: `src/app/(auth)/login/page.tsx`, `register/`, `forgot-password/`, `reset-password/`
- Triggers: Unauthenticated user access, login form submission
- Responsibilities: Render auth forms, call Supabase auth methods

**Public Routes:**
- Location: `src/app/(public)/[slug]/page.tsx`
- Triggers: Public static page access (e.g., company info)
- Responsibilities: Render content without auth

**API Webhooks:**
- Location: `src/app/api/webhooks/route.ts`
- Triggers: External webhook calls
- Responsibilities: Validate webhook signature, process event, mutate DB

**Proxy (Route Guard):**
- Location: `src/proxy.ts`
- Triggers: Every request matching `/admin`, `/login`, `/register`, `/reset-password`
- Responsibilities: Check auth, check role permissions, redirect if unauthorized

## Error Handling

**Strategy:** React error boundaries + per-route error boundaries + action result types

**Patterns:**

- **Route-level errors:** `src/app/admin/error.tsx` catches server/client errors in the route, displays error card with retry button
- **Server action errors:** Return `err(message)` or `err(fieldErrors)` instead of throwing; caller interprets ActionResult type
- **Async effect errors:** `useEffect` catches fetch errors and calls toast.error(); flag prevents stale updates
- **Permission errors:** `requirePermission()` throws; caught by error boundary (test with role that lacks permission)
- **Validation errors:** Zod safeParse returns field-level errors; send to form component to display per-field
- **Database errors:** Supabase .data/.error destructuring; log and return friendly message to user

## Cross-Cutting Concerns

**Logging:** Audit trail via `src/features/audit/actions/log-action.ts`
- Called after every mutation: `logAction({ action: 'entity.created', entityType: 'account', entityId, metadata })`
- Records who, what, when in audit table (queryable by role)
- Server action pattern: await logAction after successful mutation, before revalidatePath

**Validation:** Zod schemas in feature types.ts files
- Define once, validate on client (form submission) and server (action entry)
- Client validation: form library (react-hook-form + @hookform/resolvers)
- Server validation: `schema.safeParse(input)` returns ok({ fieldErrors }) or ok(data)
- Never trust client input; always validate server-side

**Authentication:** Cookie-based via @supabase/ssr
- Supabase session cookie persisted in browser
- Proxy layer reads cookie and checks auth for /admin routes
- Server components and actions call `createServerClient()` to access user context
- `proxy.ts` intercepts and validates role permissions before route renders

**Authorization:** Role-based access control (RBAC)
- Roles: admin, sales_manager, sales_rep, customer_success, marketing
- Permissions: fine-grained (e.g., accounts.read, accounts.write, audit.read)
- Proxy layer checks route-to-permission mappings; rejects if user role lacks permission
- Action layer checks permission via `requirePermission('action.type')`; throws if denied

---

*Architecture analysis: 2026-03-20*
