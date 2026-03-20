# Next.js + Supabase: How It Works in This Project

This guide explains how Next.js and Supabase work together in the PHPro CRM, focusing on the server/client boundary and why things are structured the way they are.

---

## The Core Idea

Next.js lets you run code in **two places**: the server (Node.js) and the browser (client). Supabase is a database-as-a-service that exposes a REST API. The key question is: **who talks to Supabase — the server or the browser?**

In this project, **both do**, but for different reasons:

| Who | When | Why |
|-----|------|-----|
| **Server** | Page load, form submissions | Fast (no round-trip to browser), secure (cookies, service role key) |
| **Browser** | Pagination, filtering, real-time | Interactive — user changes need immediate response |

---

## Three Supabase Clients

This project has three Supabase clients, each for a different context:

### 1. Browser Client (`src/lib/supabase/client.ts`)

```ts
import { createBrowserClient } from '@supabase/ssr';

let client = null; // Singleton — one instance for the whole browser session

export function createBrowserClient() {
  if (!client) {
    client = createClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY);
  }
  return client;
}
```

- **Used in:** Client components (`'use client'`), hooks (`useEntity`, `useRealtime`, `useAuth`)
- **Auth:** Sends the user's session cookie automatically
- **RLS:** Queries are filtered by Row Level Security policies
- **Why singleton?** Prevents multiple WebSocket connections and token refresh intervals

### 2. Server Client (`src/lib/supabase/server.ts`)

```ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createServerClient() {
  const cookieStore = await cookies();
  return createClient(SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, {
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
- **Auth:** Reads cookies from the incoming HTTP request — the user's session is available server-side
- **RLS:** Same as browser client — queries respect RLS policies
- **NOT a singleton:** Created fresh per request (each request has different cookies)
- **Why `try/catch` on `setAll`?** Server Components are read-only. Only Server Actions and Route Handlers can set cookies. The `catch` silently ignores the write attempt in Server Components.

### 3. Admin/Service Role Client (`src/lib/supabase/admin.ts`)

```ts
import { createClient } from '@supabase/supabase-js';

export function createServiceRoleClient() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
```

- **Used in:** Audit logging, user invitations, admin operations
- **Auth:** Uses the service role key — **bypasses RLS entirely**
- **Danger:** This client can read/write everything. Only use server-side, for operations that genuinely need to bypass row-level security (e.g., writing audit logs that the user shouldn't be able to delete)

### Quick Reference

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
│  createServerClient()   ←── per-request, reads cookies()        │
│  Used by: page.tsx, server actions, cached queries               │
│  Security: RLS enforced (user's session from cookie)            │
│                                                                 │
│  createServiceRoleClient()  ←── service role key, bypasses RLS  │
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

## Server Components vs Client Components

### Server Components (default)

Every `.tsx` file in `src/app/` is a **Server Component** by default. Server Components:
- Run on the server only (Node.js)
- Can `await` async operations directly
- Can access cookies, headers, environment variables
- Cannot use hooks (`useState`, `useEffect`, etc.)
- Cannot handle browser events (`onClick`, `onChange`, etc.)
- Are **not** included in the JavaScript bundle sent to the browser

**Example — a page that fetches data:**

```tsx
// src/app/admin/accounts/page.tsx — Server Component (no 'use client')
import { getAccounts } from '@/features/accounts/queries/get-accounts';
import { AccountList } from '@/features/accounts/components/account-list';

export default async function AccountsPage() {
  const { data, count } = await getAccounts();  // Runs on server
  return <AccountList initialData={data} initialCount={count} />;
}
```

This is the "thin wrapper" pattern: the page fetches data and passes it to a feature component. No business logic lives in `src/app/`.

### Client Components

Any file with `'use client'` at the top is a **Client Component**. Client Components:
- Run in the browser (and during SSR for initial HTML)
- Can use hooks, state, effects, event handlers
- Are included in the JavaScript bundle
- Receive data from server components via **props**

**Example — an interactive list:**

```tsx
// src/features/accounts/components/account-list.tsx
'use client';

import { useState, useEffect } from 'react';

export function AccountList({ initialData, initialCount }) {
  const [data, setData] = useState(initialData);    // Start with server data
  const [page, setPage] = useState(1);

  // Only fetch client-side when user changes page/filters
  useEffect(() => {
    if (page === 1 && !hasActiveFilters) return; // Skip — server data is current
    fetchNewPage(page).then(setData);
  }, [page]);

  return <DataTable data={data} onPageChange={setPage} />;
}
```

### The Boundary Rule

Data flows **server → client** via props. Never the reverse.

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
  │                              │ renders immediately
  │                              │ (no loading spinner!)
  │                              │
  │                              │ user clicks "page 2"
  │                              │ → client fetches from
  │                              │   Supabase (or server action)
  │                              ▼
```

**Why this matters:** The user sees data immediately on page load — no loading spinner, no flash of empty content. Client-side fetching only kicks in when the user interacts (changes page, applies a filter).

---

## Queries: `React.cache()` and Why

Server queries are wrapped in `React.cache()`:

```ts
// src/features/accounts/queries/get-accounts.ts
import { cache } from 'react';
import { createServerClient } from '@/lib/supabase/server';

export const getAccounts = cache(async (params) => {
  const supabase = await createServerClient();
  const { data, count } = await supabase
    .from('accounts')
    .select('*', { count: 'exact' })
    .range(from, to);
  return { data, count };
});
```

### What `React.cache()` does

Within a **single server request**, if `getAccounts()` is called multiple times (e.g., by both the page and a layout), it only executes **once**. The second call returns the cached result.

This is **per-request** caching, not persistent caching. Each new page load creates fresh caches.

### Why it matters

Without `cache()`, if a page and its layout both call `getAccounts()`, Supabase would receive two identical queries. With `cache()`, it's deduplicated to one.

---

## Server Actions: Mutations

Server actions handle all data mutations (create, update, delete):

```ts
// src/features/accounts/actions/create-account.ts
'use server';

import { createServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { ok, err, type ActionResult } from '@/lib/action-result';

export async function createAccount(values): Promise<ActionResult<{ id: string }>> {
  // 1. Validate input
  const parsed = schema.safeParse(values);
  if (!parsed.success) return err(parsed.error.flatten().fieldErrors);

  // 2. Execute mutation
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('accounts')
    .insert(parsed.data)
    .select('id')
    .single();
  if (error) return err(error.message);

  // 3. Bust cache so pages show fresh data
  revalidatePath('/admin/accounts');

  return ok(data);
}
```

### Key rules:

1. **`'use server'`** — marks this as a server action. Next.js creates an HTTP endpoint for it automatically.
2. **Never `throw`** — return `ActionResult<T>` instead. Either `ok(data)` or `err(message)`.
3. **Always validate with Zod** — never trust client input.
4. **Call `revalidatePath()`** — tells Next.js to re-fetch cached data for that route.

### How client components call server actions:

```tsx
'use client';
import { createAccount } from '../actions/create-account';

function AccountForm() {
  async function handleSubmit(values) {
    const result = await createAccount(values); // Calls the server automatically
    if (result.error) {
      showError(result.error);
    } else {
      router.push(`/admin/accounts/${result.data.id}`);
    }
  }
}
```

Under the hood, `createAccount(values)` becomes a `POST` request to a Next.js-managed endpoint. The function body runs on the server. The client only sees the return value.

---

## Authentication Flow

### How login works

1. User submits email + password
2. Client calls `supabase.auth.signInWithPassword()`
3. Supabase's GoTrue service validates credentials, returns a JWT
4. `@supabase/ssr` stores the JWT in **HTTP-only cookies**
5. On subsequent requests, the cookie is sent automatically

### Server-side auth

Server components and actions read the cookie to identify the user:

```ts
const supabase = await createServerClient(); // Reads cookies automatically
const { data: { user } } = await supabase.auth.getUser(); // Returns the user from the JWT
```

### Client-side auth

The `useAuth()` hook listens for session changes:

```ts
const { user, role, loading } = useAuth();
```

**Important gotcha:** The `useAuth` hook uses `onAuthStateChange` to detect the session. Inside that callback, you must **never** `await` a Supabase query — it causes a deadlock. The role is fetched in a separate `.then()` chain:

```ts
// Inside onAuthStateChange callback:
supabase.from('user_profiles').select('role')
  .then(({ data }) => setState({ role: data?.role })); // Non-blocking — safe
```

See `src/lib/hooks/use-auth.ts` and the "Gotchas" section in `CLAUDE.md` for details.

---

## Environment Variables

```ts
// src/lib/env.ts — Zod-validated, lazy-loaded
```

| Variable | Available where | Purpose |
|----------|----------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Server + Browser | Supabase API URL (public) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Server + Browser | Anonymous API key (public, rate-limited) |
| `SUPABASE_URL` | Server only | Internal Supabase URL (may differ from public URL) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | **Secret** — full database access, bypasses RLS |

**Rule:** Variables prefixed with `NEXT_PUBLIC_` are embedded into the client-side JavaScript bundle by Next.js. Never put secrets there.

---

## Real-Time Updates

The `useRealtime` hook subscribes to Postgres changes via Supabase Realtime:

```tsx
const { data } = useRealtime('notifications', initialNotifications, {
  filter: `user_id=eq.${userId}`,
});
```

### How it works

1. The browser opens a WebSocket connection to Supabase
2. Supabase listens to PostgreSQL's `NOTIFY` events (via logical replication)
3. When a row in the subscribed table changes, Supabase pushes the event to the browser
4. The hook updates local state (INSERT → prepend, UPDATE → replace, DELETE → remove)

### Caveats

- **No pagination awareness:** INSERTs are prepended to the local array regardless of the current page.
- **Filter is mandatory for scoped data:** Without a `filter`, you receive changes for ALL rows — potential data leak and performance waste.
- **Uses `startTransition`:** Updates are marked as non-urgent to keep the UI responsive during rapid events.

---

## The `useEntity` Hook

A generic CRUD hook for any table:

```tsx
const { data, total, loading, fetchList } = useEntity<Account>({
  table: 'accounts',
  pageSize: 25,
  initialData,
  initialCount,
});
```

### What it provides

| Method | Purpose |
|--------|---------|
| `fetchList({ page, orFilter, eqFilters })` | Paginated listing with server-side filters |
| `create(values)` | Insert a row |
| `update(id, values)` | Update a row |
| `remove(id)` | Delete a row |
| `bulkDelete(ids)` | Delete multiple rows |

### Important: server-side filtering

All filtering is pushed to the database — never filter in JavaScript:

```ts
// ✅ Server-side: Supabase filters in PostgreSQL
fetchList({
  page: 2,
  orFilter: `name.ilike.%${search}%,domain.ilike.%${search}%`,
  eqFilters: { type: 'Klant' },
});

// ❌ Client-side: Only filters current page, misses rows on other pages
const filtered = data.filter(a => a.type === 'Klant');
```

---

## Complete Request Lifecycle

Here's what happens when a user visits `/admin/accounts`:

```
1. Browser requests /admin/accounts
   │
2. Next.js server runs AccountsPage (server component)
   │  ├── getAccounts() → createServerClient() → reads cookies
   │  │   └── Supabase query: SELECT ... FROM accounts (with RLS)
   │  └── getUsers() → same pattern
   │  └── Promise.all() — both run in parallel
   │
3. Server renders HTML with data embedded
   │  └── <AccountList initialData={data} initialCount={count} />
   │
4. Browser receives HTML — user sees data immediately (no spinner)
   │
5. React hydrates — AccountList becomes interactive
   │  └── useState(initialData) — starts with server data
   │
6. User clicks "page 2"
   │  └── searchAccounts({ page: 2 }) — server action
   │      └── Runs on server → createServerClient() → Supabase query
   │      └── Returns { data, count } to browser
   │      └── AccountList re-renders with page 2 data
   │
7. User types in search box
   │  └── searchAccounts({ filters: { search: 'acme' } }) — server action
   │      └── Supabase: ... WHERE name ILIKE '%acme%'
   │      └── Returns filtered results
```

---

## Common Patterns Summary

| Pattern | Where | Example |
|---------|-------|---------|
| Fetch on server, pass as props | `page.tsx` → component | `getAccounts()` → `<AccountList initialData={data} />` |
| Client re-fetch on interaction | Client component | `useEffect` → `searchAccounts()` on filter change |
| Mutation via server action | Form component | `await createAccount(values)` |
| Real-time subscription | Client component | `useRealtime('notifications', data, { filter })` |
| Auth check (server) | Server action | `await requirePermission('accounts.write')` |
| Auth check (client) | Client component | `const { user, role } = useAuth()` |
| Cache busting after mutation | Server action | `revalidatePath('/admin/accounts')` |
| Parallel server fetches | `page.tsx` | `Promise.all([getAccounts(), getUsers()])` |
