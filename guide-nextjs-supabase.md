# Next.js + Supabase: How It Works in This Project

This guide explains how Next.js and Supabase work together in the PHPro CRM. After reading it, you should understand the server/client boundary, how data flows, and why things are structured the way they are.

---

## 1. Architecture Overview

Next.js runs code in **two places**: the server (Node.js) and the browser. Supabase is a self-hosted PostgreSQL database with a REST API (PostgREST), auth (GoTrue), real-time subscriptions, and file storage — all behind a Kong API gateway on port 8000.

Both the server and browser talk to Supabase, but for different reasons:

| Who | When | Why |
|-----|------|-----|
| **Server** | Page load, form submissions | Fast (no browser round-trip), secure (cookies, service role key) |
| **Browser** | Pagination, filtering, real-time | Interactive — user actions need immediate response |

```
┌─────────────────────────────────────────────────────────────────┐
│                        BROWSER                                  │
│                                                                 │
│  createBrowserClient()  ←── singleton, anon key, session cookie │
│  Used by: useEntity, useRealtime, useAuth                       │
│  Security: RLS enforced                                         │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP requests
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                     NEXT.JS SERVER                              │
│                                                                 │
│  createServerClient()       ←── per-request, reads cookies()    │
│  Used by: page.tsx, server actions, cached queries              │
│  Security: RLS enforced (user's session from cookie)            │
│                                                                 │
│  createServiceRoleClient()  ←── singleton, bypasses RLS         │
│  Used by: audit logs, user invites, admin ops                   │
│  Security: NO RLS — full database access                        │
└────────────────────────────┬────────────────────────────────────┘
                             │ REST API (PostgREST)
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                       SUPABASE                                  │
│  PostgreSQL + PostgREST + GoTrue (auth) + Realtime + Storage    │
│  Self-hosted via Docker Compose, Kong gateway on port 8000      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Three Supabase Clients

### Browser Client — `src/lib/supabase/client.ts`

```ts
import { createBrowserClient as createClient } from '@supabase/ssr';
import { getClientEnv } from '@/lib/env';
import type { Database } from '@/types/database';

let client: ReturnType<typeof createClient<Database>> | null = null;

export function createBrowserClient() {
  if (!client) {
    const env = getClientEnv();
    client = createClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  }
  return client;
}
```

- **Used in:** Client components (`'use client'`), hooks (`useEntity`, `useRealtime`, `useAuth`)
- **Auth:** Sends the user's session cookie automatically
- **RLS:** Queries are filtered by Row Level Security policies
- **Singleton:** Prevents multiple WebSocket connections and token refresh intervals

Also exports `withApiKey(signedUrl)` — appends the anon key as a query parameter so signed URLs work through Kong (which requires `apikey` on every request).

### Server Client — `src/lib/supabase/server.ts`

```ts
import { createServerClient as createClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getClientEnv, getServerEnv } from '@/lib/env';
import type { Database } from '@/types/database';

export async function createServerClient() {
  const cookieStore = await cookies();
  const env = getServerEnv();
  const clientEnv = getClientEnv();

  return createClient<Database>(env.SUPABASE_URL, clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() { return cookieStore.getAll(); },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options));
        } catch { /* Server Components can't set cookies — ignore */ }
      },
    },
  });
}
```

- **Used in:** Server components (pages), server actions, cached queries
- **Auth:** Reads cookies from the incoming HTTP request
- **RLS:** Respects RLS policies (user's session from cookie)
- **`async`:** Must be `await`ed because `cookies()` is async in Next.js 16
- **Not a singleton:** Created fresh per request (each request has different cookies)
- **Why `try/catch` on `setAll`?** Server Components are read-only. Only Server Actions and Route Handlers can set cookies.

### Service Role Client — `src/lib/supabase/admin.ts`

```ts
import { createClient } from '@supabase/supabase-js';
import { getServerEnv } from '@/lib/env';
import type { Database } from '@/types/database';

let cachedClient: SupabaseClient<Database> | null = null;

export function createServiceRoleClient(): SupabaseClient<Database> {
  if (cachedClient) return cachedClient;
  const env = getServerEnv();
  cachedClient = createClient<Database>(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return cachedClient;
}
```

- **Used in:** Audit logging, user invitations, admin operations
- **Auth:** Uses the service role key — **bypasses RLS entirely**
- **Singleton:** No user context, so a shared instance is safe
- **Danger:** Can read/write everything. Only use for operations that genuinely need to bypass RLS

---

## 3. Server Components vs Client Components

### Server Components (default)

Every `.tsx` file in `src/app/` is a Server Component by default. They:
- Run on the server only (Node.js)
- Can `await` async operations directly
- Can access cookies, headers, environment variables
- Cannot use hooks, state, or browser events
- Are NOT included in the JavaScript bundle sent to the browser

### Client Components

Any file with `'use client'` at the top. They:
- Run in the browser (and during SSR for initial HTML)
- Can use hooks, state, effects, event handlers
- Are included in the JavaScript bundle
- Receive data from server components via **props**

### The Server-First Data Flow

This is the most important pattern in the project. Data flows **server → client** via props:

```
Server Component (page.tsx)
  │
  │  await getAccounts()  ← server fetches from Supabase
  │
  │  passes as props ──────────────────────┐
  │                                        ▼
  │                              Client Component
  │                              (account-list.tsx)
  │                              │
  │                              │ renders immediately with initialData
  │                              │ (no loading spinner, no flash!)
  │                              │
  │                              │ user clicks "page 2" or types a search
  │                              │ → useEntity.fetchList() queries Supabase
  │                              │   directly from the browser
  │                              ▼
```

**Why:** The user sees data immediately on page load. Client-side fetching only kicks in when the user interacts.

**Example — the page fetches, the component renders:**

```tsx
// src/app/admin/accounts/page.tsx — Server Component (no 'use client')
export default async function AccountsPage() {
  const { data, count } = await getAccounts();
  return <AccountList initialData={data} initialCount={count} />;
}
```

```tsx
// src/features/accounts/components/account-list.tsx — Client Component
'use client';
export function AccountList({ initialData, initialCount }: Props) {
  const { data, total, fetchList, refreshing } = useEntity<AccountListItem>({
    table: 'accounts',
    pageSize: 25,
    initialData,     // ← starts with server data
    initialCount,
  });
  // Only re-fetches when user changes page/filters
}
```

---

## 4. Reading Data

### Server Queries — `React.cache()`

Server queries live in `src/features/*/queries/` and are wrapped in `React.cache()`:

```ts
// src/features/accounts/queries/get-accounts.ts
import { cache } from 'react';
import { createServerClient } from '@/lib/supabase/server';

export const getAccounts = cache(async () => {
  const supabase = await createServerClient();
  const { data, count } = await supabase
    .from('accounts')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(0, 24);
  return { data: data ?? [], count: count ?? 0 };
});
```

**What `React.cache()` does:** Within a single server request, if `getAccounts()` is called multiple times (e.g., by both a page and its layout), it only executes **once**. This is per-request deduplication, not persistent caching.

### Client Queries — `useEntity` hook

The `useEntity` hook (`src/lib/hooks/use-entity.ts`) provides paginated listing with server-side filtering:

```tsx
const { data, total, loading, refreshing, fetchList } = useEntity<Account>({
  table: 'accounts',
  pageSize: 25,
  initialData,    // from server — avoids loading flash
  initialCount,
});
```

| Property / Method | Purpose |
|-------------------|---------|
| `data` | Current page of rows |
| `total` | Total row count across all pages |
| `loading` | `true` during initial load (no data yet) |
| `refreshing` | `true` when re-fetching while existing data is displayed |
| `fetchList({ page, sort, orFilter, eqFilters })` | Paginated listing with server-side filters |
| `getById(id)` | Fetch a single row |
| `create(values)` | Insert a row (shows toast) |
| `update(id, values)` | Update a row (shows toast) |
| `remove(id)` | Delete a row (shows toast) |
| `bulkDelete(ids)` | Delete multiple rows (shows toast) |

**Critical rule — server-side filtering only:**

```ts
// GOOD: Supabase filters in PostgreSQL
fetchList({
  page: 2,
  orFilter: `name.ilike.%${search}%,domain.ilike.%${search}%`,
  eqFilters: { type: 'Klant' },
});

// BAD: Only filters current page, misses rows on other pages
const filtered = data.filter(a => a.type === 'Klant');
```

**Skip-initial-mount pattern:** List components skip the first `fetchList` call since `initialData` is already loaded by the server:

```tsx
const isInitialMount = useRef(true);
useEffect(() => {
  if (isInitialMount.current) { isInitialMount.current = false; return; }
  load(); // only runs on subsequent filter/page changes
}, [load]);
```

---

## 5. Writing Data — Server Actions

All mutations (create, update, delete) use server actions in `src/features/*/actions/`. They follow a strict pattern:

```ts
// src/features/contacts/actions/create-contact.ts
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { logAction } from '@/features/audit/actions/log-action';
import { type ActionResult, err, ok } from '@/lib/action-result';
import { logger } from '@/lib/logger';
import { requirePermission } from '@/lib/require-permission';
import { createServerClient } from '@/lib/supabase/server';
import { contactFormSchema, type ContactFormValues } from '../types';

export async function createContact(values: ContactFormValues): Promise<ActionResult<{ id: string }>> {
  // 1. Permission check — wrapped in try/catch, returns err() on failure
  try {
    await requirePermission('contacts.write');
  } catch {
    return err('Onvoldoende rechten');
  }

  // 2. Zod validation — safeParse, not parse (never throw)
  const parsed = contactFormSchema.safeParse(values);
  if (!parsed.success) return err(z.flattenError(parsed.error).fieldErrors);

  // 3. Supabase query
  const supabase = await createServerClient();
  const { data, error } = await supabase.from('contacts').insert(parsed.data).select('id').single();

  // 4. Error handling — log + return err()
  if (error) {
    logger.error({ err: error }, '[createContact] database error');
    return err('Er is een fout opgetreden');
  }

  // 5. Audit log
  await logAction({ action: 'contact.created', entityType: 'contact', entityId: data.id });

  // 6. Bust cache so pages show fresh data
  revalidatePath('/admin/contacts');
  return ok(data);
}
```

### ActionResult — the return type

Server actions **never throw**. They return `ActionResult<T>`:

```ts
type ActionResult<T = void> =
  | { success: true; data?: T; error?: never }    // ok()
  | { error: string | Record<string, string[]>; success?: never; data?: never };  // err()
```

- `ok()` for void success, `ok(data)` for success with data
- `err('message')` for generic errors
- `err(fieldErrors)` for Zod validation errors (`Record<string, string[]>`)
- `success` and `error` are mutually exclusive via `never` — TypeScript narrows correctly

### How client components call server actions

The project uses React 19's `useActionState` with native `<form action>`:

```tsx
'use client';
import { useActionState } from 'react';
import { toast } from 'sonner';
import { SubmitButton } from '@/components/ui/submit-button';
import { createContact } from '../actions/create-contact';

function ContactForm() {
  const [, formAction] = useActionState(async (_prev: null, fd: FormData) => {
    // Parse FormData into typed values
    const values = {
      first_name: fd.get('first_name') as string,
      last_name: fd.get('last_name') as string,
    };

    // Call the server action
    const result = await createContact(values);

    if (!result.success) {
      toast.error(typeof result.error === 'string' ? result.error : 'Validatiefout');
      return null;
    }

    toast.success('Contact aangemaakt');
    return null;
  }, null);

  return (
    <form action={formAction}>
      <input name="first_name" />
      <input name="last_name" />
      <SubmitButton>Opslaan</SubmitButton>  {/* auto-disables during submission */}
    </form>
  );
}
```

**Key rules:**
- `useActionState` from `react` (not `react-dom`), signature: `[state, action, isPending]`
- Native `<form action={fn}>`, not `onSubmit + e.preventDefault()`
- `SubmitButton` uses `useFormStatus()` internally — auto-disables during submission
- All toast messages and labels are in **Dutch**

### `revalidatePath()` — cache busting

After a mutation, `revalidatePath('/admin/contacts')` tells Next.js that the cached server data for that route is stale. The next time a user visits (or `router.refresh()` is called), the server re-fetches from Supabase.

---

## 6. Authentication

### How login works

1. User submits email + password
2. Client calls `supabase.auth.signInWithPassword()`
3. Supabase's GoTrue service validates credentials, returns a JWT
4. `@supabase/ssr` stores the JWT in **HTTP-only cookies**
5. On subsequent requests, the cookie is sent automatically

### Server-side auth

Server components and actions read the cookie to identify the user:

```ts
const supabase = await createServerClient();
const { data: { user } } = await supabase.auth.getUser();
```

For permission checks, use the `requirePermission` helper:

```ts
try {
  const { userId, role } = await requirePermission('contacts.write');
} catch {
  return err('Onvoldoende rechten');
}
```

This checks auth (via `getUser`), fetches the role from `user_profiles`, and verifies the permission against the ACL map in `src/lib/acl.ts`.

### Client-side auth — `useAuth` hook

```ts
const { user, role, avatarPath, fullName, loading } = useAuth();
```

**Critical gotcha:** The `useAuth` hook uses `onAuthStateChange` to detect the session. Inside that callback, you must **never** `await` a Supabase query — it causes a deadlock because:
1. `_notifyAllSubscribers` **awaits** all listener callbacks via `Promise.all`
2. Every `supabase.from().select()` internally calls `auth.getSession()`, which **awaits** `initializePromise`
3. Since `_notifyAllSubscribers` runs during initialization, this creates a circular wait

The role is fetched in a separate, non-blocking `.then()` chain:

```ts
supabase.auth.onAuthStateChange((_event, session) => {
  setState((prev) => ({ ...prev, user: session.user, loading: false }));
  // Non-blocking — fetch role outside the callback's synchronous flow
  supabase.from('user_profiles').select('role, avatar_url, full_name')
    .eq('id', session.user.id).single()
    .then(({ data }) => setState((prev) => ({ ...prev, role: data?.role })));
});
```

---

## 7. Real-Time Updates

The `useRealtime` hook (`src/lib/hooks/use-realtime.ts`) subscribes to Postgres changes:

```tsx
const { data, events } = useRealtime<Notification>('notifications', initialData, {
  filter: `user_id=eq.${userId}`,  // mandatory for scoped data
});
```

### How it works

1. The browser opens a WebSocket connection to Supabase
2. Supabase listens to PostgreSQL's `NOTIFY` events (via logical replication)
3. When a row changes, Supabase pushes the event to the browser
4. The hook updates local state: INSERT → prepend, UPDATE → replace, DELETE → remove

### What it returns

| Field | Type | Description |
|-------|------|-------------|
| `data` | `T[]` | Live-updating array |
| `events` | `RealtimeEvent[]` | Rolling buffer of last 50 raw events (useful for activity feeds) |

### Caveats

- **No pagination awareness:** INSERTs are prepended regardless of the current page
- **Filter is mandatory for scoped data:** Without a `filter`, you receive ALL changes — potential data leak
- **Uses `startTransition`:** Updates are marked as non-urgent to keep the UI responsive during rapid events
- **Table must opt in:** The table's migration must include `ALTER PUBLICATION supabase_realtime ADD TABLE public.{{table}}`

---

## 8. Environment Variables

All env vars are validated with Zod on first access via `src/lib/env.ts`. Validation is lazy (not at import time) to avoid build failures during SSR prerendering.

| Variable | Available where | Purpose |
|----------|----------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Browser + server | Supabase API URL for browser client |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser + server | Anonymous API key (public, rate-limited) |
| `SUPABASE_URL` | Server only | Supabase URL for server clients (may differ from public URL) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | **Secret** — full database access, bypasses RLS |

**Rule:** `NEXT_PUBLIC_` variables are embedded into the client-side JavaScript bundle. Never put secrets there.

---

## 9. Complete Request Lifecycle

What happens when a user visits `/admin/accounts` and then paginates:

```
1. Browser requests /admin/accounts
   │
2. Next.js middleware checks auth cookie + route permissions
   │  └── Redirects to /login if not authenticated or insufficient permissions
   │
3. Next.js server runs AccountsPage (async server component)
   │  └── getAccounts() → createServerClient() → reads cookies
   │      └── Supabase query: SELECT ... FROM accounts (with RLS)
   │      └── Wrapped in React.cache() — deduplicated if called elsewhere in this request
   │
4. Server renders HTML with data embedded in the component tree
   │  └── <AccountList initialData={data} initialCount={count} />
   │
5. Browser receives HTML — user sees the full table immediately (no spinner)
   │
6. React hydrates — AccountList becomes interactive
   │  └── useState(initialData) — starts with server-fetched data
   │  └── isInitialMount ref prevents a redundant fetch on mount
   │
7. User clicks "page 2"
   │  └── setPage(2) triggers useEffect → fetchList({ page: 2 })
   │      └── useEntity calls createBrowserClient() → Supabase query
   │      └── Browser sends the request directly to Supabase (not through Next.js)
   │      └── setData(newRows), setTotal(newCount)
   │      └── DataTable re-renders with page 2 data
   │
8. User clicks "Verwijderen" on a row
   │  └── ConfirmDialog opens (from rowActions.confirm)
   │  └── User confirms → deleteAccount(id) server action is called
   │      └── Browser POSTs to a Next.js-managed endpoint
   │      └── Server runs: requirePermission → safeParse → delete → logAction → revalidatePath
   │      └── Returns ok() or err() to the browser
   │  └── On success: toast.success() + load() re-fetches the list + router.refresh()
```

---

## 10. Key Patterns at a Glance

| Pattern | Where | Example |
|---------|-------|---------|
| Fetch on server, pass as props | `page.tsx` → component | `getAccounts()` → `<AccountList initialData={data} />` |
| Client re-fetch on interaction | Client component | `useEntity.fetchList()` on page/filter change |
| Mutation via server action | Form component | `await createAccount(values)` returns `ActionResult` |
| React 19 form submission | Form component | `useActionState` + `<form action={fn}>` + `SubmitButton` |
| Real-time subscription | Client component | `useRealtime('notifications', data, { filter })` |
| Auth check (server) | Server action | `await requirePermission('accounts.write')` in try/catch |
| Auth check (client) | Client component | `const { user, role } = useAuth()` |
| Cache busting after mutation | Server action | `revalidatePath('/admin/accounts')` |
| Parallel server fetches | `page.tsx` | `Promise.all([getAccounts(), getUsers()])` |
| Query deduplication | Server queries | `React.cache()` wrapper |
