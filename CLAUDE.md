# CLAUDE.md

## Stack

- Next.js 16 (App Router, Turbopack)
- React 19
- Supabase (self-hosted via Docker Compose, Kong gateway on port 8000)
- `@supabase/ssr` for cookie-based auth
- Tailwind CSS v4, shadcn/ui components
- TypeScript strict mode

## Architecture Rules

### Feature Module Structure

Every feature under `src/features/<name>/` MUST follow this structure:

```
src/features/<name>/
├── actions/          # Server actions ('use server') — mutations only
│   ├── create-<name>.ts
│   ├── update-<name>.ts
│   └── delete-<name>.ts
├── queries/          # Server queries wrapped in React.cache()
│   ├── get-<name>.ts     # Single record
│   └── get-<names>.ts    # List with pagination/filters
├── components/       # Client components ('use client') — UI only
│   ├── <name>-list.tsx       # List view (accepts initialData/initialCount)
│   ├── <name>-detail.tsx     # Detail view
│   └── <name>-form.tsx       # Create/edit form
├── types.ts          # Zod schemas, DB row types, filter types
└── columns.ts        # TanStack Table column defs (if table-based)
```

**Non-negotiable rules:**
- **No business logic in `src/app/`** — pages are thin wrappers that call queries and render feature components
- **No new feature code outside `src/features/`** — if it's feature-specific, it lives in the feature folder
- **Every list component MUST accept `initialData`/`initialCount` props** — server components fetch and pass data to eliminate client-side waterfalls
- **Every query MUST be wrapped in `React.cache()`** — for per-request deduplication
- **Actions validate with Zod on both client and server** — never trust client input
- **Actions MUST use `ActionResult<T>`** — import `ok`, `err` from `@/lib/action-result`. Never `throw` from server actions, never return bare `{ error }` or `{ success }` objects

### Route Structure

Every admin route MUST have these files:

```
src/app/admin/<name>/
├── page.tsx          # Async server component — fetches data, renders feature components
├── loading.tsx       # Skeleton UI matching page layout
└── error.tsx         # Route-specific error boundary with contextual message
```

Detail routes follow:
```
src/app/admin/<name>/[id]/
├── page.tsx          # Async — calls get<Name>(id), notFound() if missing, exports generateMetadata
├── loading.tsx       # Skeleton
└── error.tsx         # (inherits from parent if not needed)
```

**Detail pages MUST export `generateMetadata`** for dynamic titles:
```tsx
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const item = await getItem(id);
  return { title: item?.name ?? 'Item' }; // template in root layout appends " — PHPro CRM"
}
```

### Server-First Data Flow

**This is the most important rule.** Data flows server → client, never client → server → client.

```
Page (server component)
  → calls getAccounts() (React.cache query)
  → passes data as props to <AccountList initialData={data} initialCount={count} />

AccountList (client component)
  → renders immediately with initialData (no loading flash)
  → only fetches client-side when user changes page/filters
  → uses useEntity hook with orFilter/eqFilters for server-side filtering
```

**NEVER do this:**
```tsx
// BAD: Client component fetches on mount — creates waterfall
export function AccountList() {
  const { data, fetchList } = useEntity({ table: 'accounts' });
  useEffect(() => { fetchList(); }, []); // ← waterfall!
}
```

**ALWAYS do this:**
```tsx
// GOOD: Server passes initial data, client only re-fetches on interaction
export default async function AccountsPage() {
  const { data, count } = await getAccounts();
  return <AccountList initialData={data} initialCount={count} />;
}
```

### Filtering: Server-Side Only

**NEVER filter data client-side** (`.filter()` on fetched arrays). Push all filtering to the database via Supabase query parameters.

```tsx
// BAD: Fetches all records, filters in JS — only works on current page
const filtered = data.filter((a) => a.type === filters.type);

// GOOD: Passes filters to database query
fetchList({
  page,
  orFilter: search ? `name.ilike.%${search}%,domain.ilike.%${search}%` : undefined,
  eqFilters: { type: filters.type },
});
```

### Async Effect Cleanup

Every `useEffect` with async operations MUST include a cancellation flag:

```tsx
useEffect(() => {
  let cancelled = false;
  fetchData().then((result) => {
    if (cancelled) return; // Prevent stale updates
    setData(result);
  });
  return () => { cancelled = true; };
}, [deps]);
```

### Component Boundaries

- **Server Components** (`page.tsx`, `layout.tsx`): Fetch data, pass as props. No hooks, no state.
- **Client Components** (`'use client'`): Interactive UI, hooks, state. Receive data via props from server.
- **Never add `'use client'` to a component that doesn't need interactivity** — prefer server components for static rendering.

### Parallel Fetching

When a server component needs multiple data sources, always use `Promise.all()`:

```tsx
// GOOD
const [accounts, contacts, users] = await Promise.all([
  getAccounts(),
  getContacts(),
  getUsers(),
]);

// BAD — sequential waterfalls
const accounts = await getAccounts();
const contacts = await getContacts();
const users = await getUsers();
```

### Shared Components

```
src/components/
├── admin/     # Reusable admin UI (data-table, page-header, modal, confirm-dialog)
├── layout/    # Global layout (sidebar, topbar)
└── ui/        # shadcn/ui primitives (button, input, card, etc.)
```

**Rule:** If a component is only used by one feature, it goes in `src/features/<name>/components/`, NOT in `src/components/`.

### Hooks

```
src/lib/hooks/
├── use-auth.ts        # Auth state + role
├── use-entity.ts      # Generic CRUD + pagination (with initialData support)
├── use-realtime.ts    # Supabase real-time subscriptions
└── use-file-upload.ts # File handling
```

**Rule:** Feature-specific hooks go in `src/features/<name>/hooks/`, not in `src/lib/hooks/`.

## Naming Conventions

| Item | Convention | Example |
|------|-----------|---------|
| Files | kebab-case | `account-list.tsx`, `get-accounts.ts` |
| Components | PascalCase export | `export function AccountList` |
| Hooks | camelCase with `use` prefix | `useEntity`, `useRealtime` |
| Types | PascalCase | `Account`, `ContactWithDetails` |
| Server actions | camelCase | `createAccount`, `updateContact` |
| Route params | `[id]` (singular) | `admin/accounts/[id]` |
| Page components | `default export` | `export default async function AccountsPage()` |
| Feature components | named export | `export function AccountList()` |

## Bundle Rules

- **No barrel files** (`index.ts` re-exports) — they prevent tree-shaking. Import directly from file paths.
- **Use `next/dynamic`** for heavy components not needed on initial load (modals, editors, charts).
- **No unnecessary `'use client'`** — every `'use client'` adds to the client bundle.

## Database: Three-Layer Data Strategy

```
supabase/
  migrations/          # Schema only — DDL, triggers, RLS, grants
  data/                # Production data — required in every environment
  fixtures/            # Demo data — dev/staging only, never production
  seed.sql             # Orchestrator — runs data/ then fixtures/
```

**Commands:**
| Command | What it runs | When to use |
|---------|-------------|-------------|
| `task db:reset` | Drop schema + migrations + data + fixtures | Full local rebuild |
| `task db:migrate` | `supabase/migrations/*.sql` | Apply schema changes |
| `task db:data` | `supabase/data/*.sql` | Production deploy, CI/CD |
| `task db:fixtures` | `supabase/fixtures/*.sql` | Dev/staging setup |
| `task db:seed` | Both data + fixtures | After manual migration run |

All commands run inside Docker via `docker compose exec` against the `db` container.

**Rules:**
- **Migrations contain schema only** — `CREATE TABLE`, `ALTER`, `CREATE FUNCTION`, `CREATE TRIGGER`, `ENABLE ROW LEVEL SECURITY`, `CREATE POLICY`, `GRANT`. Never `INSERT` data.
- **Production data goes in `supabase/data/`** — pipelines, stages, reference indices, default settings. Must be idempotent (`ON CONFLICT DO NOTHING`). Run in every environment including production via `npm run db:data`.
- **Demo/test data goes in `supabase/fixtures/`** — fake users, sample accounts, contacts. Must be idempotent. Never runs in production. Only via `npm run db:fixtures`.
- **`seed.sql`** — fallback for `supabase db reset`, includes both data/ and fixtures/ via `\ir`.
- **New tables MUST include `GRANT` statements** in the migration — without table-level grants, RLS policies are useless. Use `GRANT SELECT, INSERT, UPDATE, DELETE ON <table> TO authenticated;` as appropriate.
- **Files are numbered** — `001_`, `002_`, etc. for execution order within each directory.

**Adding a new table checklist:**
1. Create migration: `CREATE TABLE`, indexes, triggers, `ENABLE ROW LEVEL SECURITY`, `CREATE POLICY`, `GRANT`
2. If the table needs default production data, add a file in `supabase/data/`
3. If the table needs demo data, add a file in `supabase/fixtures/`
4. Update `seed.sql` if new data/fixture files were added

## Supabase Patterns

### Three client types — use the right one:

| Client | File | Use for |
|--------|------|---------|
| Browser | `src/lib/supabase/client.ts` | Client components, hooks |
| Server | `src/lib/supabase/server.ts` | Server components, server actions |
| Admin | `src/lib/supabase/admin.ts` | Audit logs, admin operations (bypasses RLS) |

### Query patterns:

- **Server queries** in `features/*/queries/` — wrapped in `React.cache()`, use `createServerClient()`
- **Client queries** via `useEntity` hook — use `createBrowserClient()` (singleton)
- **Mutations** via server actions in `features/*/actions/` — use `createServerClient()`, call `revalidatePath()` after

### Server Action Return Type

All server actions MUST use `ActionResult<T>` from `@/lib/action-result`:

```tsx
import { ok, err, type ActionResult } from '@/lib/action-result';

export async function createAccount(values: AccountFormValues): Promise<ActionResult<{ id: string }>> {
  const parsed = schema.safeParse(values);
  if (!parsed.success) return err(parsed.error.flatten().fieldErrors);

  const { data, error } = await supabase.from('accounts').insert(parsed.data).select('id').single();
  if (error) return err(error.message);

  return ok(data);
}
```

**NEVER `throw` from server actions** — the caller can't distinguish action errors from framework errors.

### File Upload Validation

`useFileUpload` validates files client-side before upload:
- **MIME type whitelist** — only allowed types (documents, images, archives)
- **Size limit** — default 10MB, configurable per-upload
- Both are enforced via the `validateFile()` function before the Supabase upload call

### Realtime Filtering

`useRealtime` accepts an optional `filter` parameter to scope events to relevant rows:

```tsx
// GOOD: Only receive notifications for this user
useRealtime('notifications', initialData, { filter: `user_id=eq.${userId}` });

// BAD: Subscribes to ALL changes (data leak, performance waste)
useRealtime('notifications', initialData);
```

### Security Headers

CSP, HSTS, X-Frame-Options, Permissions-Policy are configured in `next.config.ts`. When adding new external resources (CDNs, APIs), update the CSP directives.

## Gotchas

### Supabase: Never `await` Supabase queries inside `onAuthStateChange` callbacks

`supabase.auth.onAuthStateChange()` callbacks are invoked by `_notifyAllSubscribers`, which **awaits all listener callbacks** via `Promise.all`. Meanwhile, every `supabase.from().select()` call internally calls `auth.getSession()`, which **awaits `initializePromise`**. Since `_notifyAllSubscribers` runs during initialization, this creates a **deadlock**: initialization waits for the listener, the listener waits for initialization.

**Bad** (deadlocks):
```ts
supabase.auth.onAuthStateChange(async (_event, session) => {
  const { data } = await supabase.from('user_profiles').select('role')...
  setState({ user: session.user, role: data?.role });
});
```

**Good** (non-blocking):
```ts
supabase.auth.onAuthStateChange((_event, session) => {
  setState(prev => ({ ...prev, user: session.user }));
  supabase.from('user_profiles').select('role')...
    .then(({ data }) => setState(prev => ({ ...prev, role: data?.role })));
});
```

This is safe because server-side middleware enforces auth/role checks. The client-side role is for UI only, and `null` role during the brief fetch window is more restrictive, not less.

### useRealtime: Pagination awareness

The `useRealtime` hook applies INSERT/UPDATE/DELETE events to local state. Be aware that INSERTs prepend without respecting page boundaries. Only use `useRealtime` on views where seeing live updates is more important than strict pagination.

### Dynamic table queries

`useEntity` uses `supabase.from(tableName)` with a dynamic table name, which returns a union type that TypeScript can't narrow. The `queryTable` cast is intentional and documented — don't remove the `eslint-disable` comments.

### Zod: Never use `z.string().uuid()` for ID validation

Fixture data uses non-RFC-compliant UUIDs (e.g. `a0000000-0000-0000-0000-000000000001` — version digit is `0`, not `1-8`). Zod's `z.string().uuid()` enforces strict RFC 4122 and **rejects** these.

**Use instead:**
- Required FK fields: `z.string().min(1, 'Field is verplicht')`
- Optional FK fields: `z.string().optional().nullable()`
- Action param guards: `z.string().min(1).safeParse(id).success`

The database FK constraint enforces referential integrity — Zod doesn't need to validate UUID format.
