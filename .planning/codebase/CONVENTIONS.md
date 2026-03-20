# Coding Conventions

**Analysis Date:** 2026-03-20

## Naming Patterns

**Files:**
- kebab-case for all files and directories
- Examples: `account-list.tsx`, `create-account.ts`, `get-accounts.ts`, `use-entity.ts`

**Functions:**
- camelCase for all functions (server actions, queries, hooks, utilities)
- Server actions: `createAccount`, `updateContact`, `deleteTask`, `logAction`
- Query functions: `getAccounts`, `getAccountById`, `getContactsByAccount`
- Hooks: `useEntity`, `useRealtime`, `useAuth`, `useFileUpload`, `useBrandTheme`

**Variables:**
- camelCase for local variables, state, and parameters
- Examples: `initialData`, `isLoading`, `pageSize`, `accountId`, `filterQuery`
- SCREAMING_SNAKE_CASE for constants: `PAGE_SIZE = 25`, `ROLES = [...]`

**Types:**
- PascalCase for all types, interfaces, and type aliases
- Examples: `Account`, `AccountFormValues`, `AccountListItem`, `AccountFilters`, `ActionResult`
- Database row types exported directly from database schema: `Account`, `Contact`
- Form value types inferred from Zod schemas: `AccountFormValues = z.infer<typeof accountFormSchema>`

**React Components:**
- PascalCase for named exports (feature components)
- Examples: `AccountList`, `AccountForm`, `ContactForm`, `DataTable`
- `default export` for page components: `export default async function AccountsPage()`
- Server components (async) use descriptive names: `AccountDetailPage`, `AccountsPage`

**Route Parameters:**
- Singular form in square brackets: `[id]` not `[ids]`
- Usage: `src/app/admin/accounts/[id]/page.tsx`

## Code Style

**Formatting:**
- ESLint with next/core-web-vitals + next/typescript ruleset
- Config: `eslint.config.mjs` (ESLint Flat Config format)
- No Prettier config detected — formatting enforced by ESLint rules

**Linting:**
- Tool: ESLint 9.39.4 (FlatCompat with Next.js configs)
- Rules enforced: next/core-web-vitals (Core Web Vitals + React best practices), next/typescript (TypeScript-specific rules)

**TypeScript:**
- Strict mode enabled (`"strict": true` in tsconfig.json)
- Target: ES2017
- Module: esnext
- Path alias: `@/*` → `./src/*`

**String Formatting:**
- No console.log, console.error, console.warn calls in production code — use toast notifications for user feedback
- Error logging via toast.error() from sonner library: `toast.error('Failed to load accounts')`
- Toast messages use present/past tense imperative: `'Record created'`, `'Failed to delete'`
- User-facing messages in Dutch (NL/BE): `'Controleer de verplichte velden'`, `'Er ging iets mis'`

## Import Organization

**Order:**
1. React and Next.js imports: `import { useState } from 'react'`, `import { useRouter } from 'next/navigation'`
2. Third-party packages: `import { toast } from 'sonner'`, `import { createServerClient } from '@supabase/ssr'`
3. Absolute path imports (`@/`): `import { createServerClient } from '@/lib/supabase/server'`
4. Relative imports: (rarely used, prefer absolute paths)

**Path Aliases:**
- All imports use absolute path alias `@/` — no relative imports except in rare cases
- Examples: `@/lib/hooks/use-entity`, `@/features/accounts/actions/create-account`, `@/components/ui/button`

**No Barrel Files:**
- Do not use `index.ts` for re-exports
- Import directly from source files: `import { useEntity } from '@/lib/hooks/use-entity'` NOT from `@/lib/hooks`

## Error Handling

**Patterns:**
- Server actions return `ActionResult<T>` type (discriminated union)
- Never `throw` from server actions — return error via `err()` helper
- Usage:
  ```typescript
  return ok(data)                      // { success: true, data }
  return ok()                          // { success: true }
  return err('message')                // { error: 'message' }
  return err({ field: ['required'] }) // { error: { field: ['required'] } }
  ```
- Client-side action results checked via `'error' in result` guard
- Zod validation errors flattened: `parsed.error.flatten().fieldErrors`
- Database errors returned as strings: `error.message`
- Unauthorized/forbidden errors thrown from `requirePermission()`: caught by Next.js error boundary

**Permission Guards:**
- Call `requirePermission(permission)` at top of server action
- Returns `{ userId: string; role: Role }` or throws `Error`
- Never proceed if throws — error caught by error.tsx boundary

## Logging

**Framework:** Sonner toast library

**Patterns:**
- User feedback via toast notifications (non-persistent messages)
- Error: `toast.error('Failed to create record')` or `toast.error('Controleer de verplichte velden')`
- Success: `toast.success('Record created')` or `toast.success('Contact bijgewerkt')`
- Query/fetch errors logged via console.error in fallback cases: `console.error('Failed to fetch accounts:', error?.message)`

**When to Log:**
- User actions: success/failure toasts after create/update/delete
- Field validation errors: toast with user guidance
- Database query failures: console.error in query fallback, return empty state to client
- Permission denials: error thrown from `requirePermission()`, displayed in error boundary

## Comments

**When to Comment:**
- Explain architectural decisions: "Singleton — one client instance for entire session"
- Document gotchas: "Called from Server Component — ignore" (catch block in server client)
- Clarify non-obvious type casts: "Targeted cast: .from() with dynamic table name returns union type that TS can't narrow"
- Explain why, not what (code shows what, comments show why)

**JSDoc/TSDoc:**
- Used sparingly for public APIs and complex functions
- Example: `/**\n * Standardized return type for all server actions.\n * Usage:\n * ...\n */`
- Function parameters and return types documented only if behavior is non-obvious

## Function Design

**Size:**
- Keep functions small and focused — most action/query functions are 30-50 lines
- Complex operations broken into multiple functions rather than monolithic procedures

**Parameters:**
- Use object parameters for functions with 3+ arguments
- Examples:
  ```typescript
  async function getAccounts({ filters, page = 1, pageSize = 25 } = {})
  fetchList({ page, sort, search, orFilter, eqFilters })
  ```
- Destructure in function signature for clarity

**Return Values:**
- Server actions return `ActionResult<T>` (never bare objects or throws)
- Query functions return data + metadata: `{ data: T[]; count: number }`
- Hooks return object with state + callbacks: `{ data, total, loading, fetchList, getById, create, update, remove }`
- Component props use destructured objects with type annotations

## Module Design

**Exports:**
- Named exports for feature components: `export function AccountList({ ... })`
- Default exports for page components: `export default async function AccountsPage()`
- Named exports for utilities: `export async function createAccount(...)`, `export const getAccounts = cache(...)`

**Structure per Feature:**
```
src/features/<name>/
├── actions/          # Server actions — mutations only ('use server')
├── queries/          # Server queries wrapped in React.cache()
├── components/       # Client components — UI only ('use client')
├── hooks/            # Feature-specific hooks (if needed)
├── types.ts          # Zod schemas, DB row types, filter types
└── columns.ts        # TanStack Table column definitions (if table-based)
```

**No Logic in src/app/:**
- Routes are thin wrappers: fetch data → pass to feature components
- All feature-specific code lives in `src/features/<name>/`
- Shared admin UI (DataTable, PageHeader, modals) lives in `src/components/admin/`

## Async/Await Patterns

**Cancellation Flags:**
- Not observed in current codebase (can be added when needed)
- Client-side data fetches use loading state + toast error handling instead
- Server-side queries wrapped in `React.cache()` prevent re-fetching per-request

**Parallel Fetching:**
- Use `Promise.all()` for independent data sources
- Example: `const [accounts, users, deals] = await Promise.all([getAccounts(), getUsers(), getDeals()])`
- Avoids sequential waterfalls in server components and pages

## Supabase Client Patterns

**Three Client Types:**
- `createServerClient()` from `@/lib/supabase/server.ts` — server components, server actions, queries
- `createBrowserClient()` from `@/lib/supabase/client.ts` — client components, hooks (singleton pattern)
- Admin client (if needed) — bypasses RLS for audit operations

**Query Building:**
- Supabase query is chainable builder: `.select()`, `.eq()`, `.or()`, `.range()`, `.order()`
- Example: `supabase.from('accounts').select('*', { count: 'exact' }).eq('type', 'Klant').order('name')`

## Zod Validation

**Patterns:**
- Define schema as exported constant: `export const accountFormSchema = z.object({ ... })`
- Infer type from schema: `export type AccountFormValues = z.infer<typeof accountFormSchema>`
- Validate in server action: `const parsed = schema.safeParse(values); if (!parsed.success) return err(...)`
- Validate in client form: `const parsed = schema.safeParse(values); if (!parsed.success) { toast.error(...); return; }`
- Custom error messages in Dutch: `.min(1, 'Naam is verplicht')`, `.email('Ongeldig e-mailadres')`

## Special Casting & Suppressions

**ESLint Disables:**
- `// eslint-disable-next-line @typescript-eslint/no-explicit-any` — Used when Supabase query builder returns union type that TS can't narrow
- Document why: "Targeted cast: .from() with dynamic table name returns union type that TS can't narrow"
- Use on single line before the cast, not entire function

**TypeScript Casts:**
- Minimal use of `as` — prefer proper typing
- When needed, explain in comment: `const queryTable = (t: TableName) => supabase.from(t) as any;`

---

*Convention analysis: 2026-03-20*
