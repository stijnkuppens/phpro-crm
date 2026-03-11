# PHPro Vibe Starter — Product Requirements Document

A reusable Next.js + Supabase template for spinning up client projects fast. Clone it, customize it, ship it. The admin panel is built in, the auth works, the CRUD patterns are there — so AI tools and developers can focus on building client-specific features instead of re-inventing plumbing every time.

---

## Context

PHPro is shifting toward fast, vibe-coded solutions for smaller B2B clients. Each client gets a custom app (webshop, portal, booking system, management tool) with a built-in admin panel for their staff to manage data. Supabase runs the backend. One developer (Stijn) is the primary builder, heavily using AI-assisted coding workflows.

The template must be:

- Cloneable in one command with a working dev environment
- Understandable by AI coding tools (Cursor, Lovable, Claude Code) out of the box
- Production-deployable on self-hosted infrastructure per client
- Simple enough that a solo dev can maintain 5-10 client projects without drowning

---

## Architecture

### The Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend + Admin | Next.js 15 (App Router) | SSR for public pages, SPA-like admin panel |
| UI Components | shadcn/ui + Tailwind CSS | Consistent, accessible, AI-friendly components |
| Backend | Supabase (self-hosted) | PostgreSQL, Auth, Storage, Realtime, Edge Functions |
| Infrastructure | Docker Compose | One command to spin up the full stack |
| Task Runner | Taskfile | Standardized commands for dev, build, deploy |

### Key Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `next` | 15.x | App framework |
| `react` / `react-dom` | 19.x | UI library |
| `@supabase/supabase-js` | 2.x | Supabase client |
| `@supabase/ssr` | 0.x | Supabase cookie-based auth for SSR |
| `@tanstack/react-table` | 8.x | Headless data table |
| `react-hook-form` | 7.x | Form state management |
| `@hookform/resolvers` | 3.x | Zod resolver for react-hook-form |
| `zod` | 3.x | Schema validation |
| `sonner` | 1.x | Toast notifications |
| `tailwindcss` | 4.x | Utility-first CSS |
| `class-variance-authority` | latest | Component variant management (shadcn/ui) |
| `clsx` / `tailwind-merge` | latest | Class name utilities |
| `lucide-react` | latest | Icon library |

### How It Fits Together

```
┌─────────────────────────────────────────────┐
│                  Client Browser              │
│                                              │
│  Public Pages (/shop, /about, /)             │
│  Admin Panel  (/admin/dashboard, /admin/...) │
└──────────────┬───────────────────────────────┘
               │ HTTPS
               ▼
┌──────────────────────────┐
│       Next.js App        │
│  (Docker container)      │
│                          │
│  • Server Components     │
│  • API Routes (webhooks) │
│  • Middleware (auth)      │
└──────────┬───────────────┘
           │ Supabase JS SDK
           ▼
┌──────────────────────────────────────┐
│         Supabase (self-hosted)       │
│  (Docker Compose stack)              │
│                                      │
│  ┌──────────┐  ┌──────────────────┐  │
│  │ PostgreSQL│  │ GoTrue (Auth)    │  │
│  └──────────┘  └──────────────────┘  │
│  ┌──────────┐  ┌──────────────────┐  │
│  │ PostgREST│  │ Storage (S3/local)│  │
│  └──────────┘  └──────────────────┘  │
│  ┌──────────┐  ┌──────────────────┐  │
│  │ Realtime │  │ Edge Functions    │  │
│  └──────────┘  └──────────────────┘  │
│  ┌──────────────────────────────────┐│
│  │ Kong (API Gateway)               ││
│  └──────────────────────────────────┘│
│  ┌──────────────────────────────────┐│
│  │ Supabase Studio (dev only)       ││
│  └──────────────────────────────────┘│
└──────────────────────────────────────┘
```

The Next.js app communicates with Supabase through the internal Docker network in dev. Supabase Studio (the developer dashboard) is exposed on a local port for schema management during development but disabled in production.

---

## Project Structure

```
phpro-vibe-starter/
├── src/
│   ├── app/
│   │   ├── (public)/                  # Public-facing routes
│   │   │   ├── layout.tsx             # Public layout (header, footer)
│   │   │   ├── page.tsx               # Homepage
│   │   │   └── [slug]/page.tsx        # Dynamic public pages
│   │   │
│   │   ├── (auth)/                    # Auth pages (no sidebar)
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   ├── forgot-password/page.tsx
│   │   │   └── reset-password/page.tsx
│   │   │
│   │   ├── admin/                     # Protected admin panel
│   │   │   ├── layout.tsx             # Admin shell (sidebar + topbar + auth guard)
│   │   │   ├── loading.tsx            # Route-level loading skeleton (shown during server data fetches)
│   │   │   ├── page.tsx               # Dashboard (redirects or shows stats)
│   │   │   ├── demo/                  # ← DEMO PAGES (showcase the template's capabilities)
│   │   │   │   ├── roles/page.tsx     # Role-based UI demo (show/hide per role)
│   │   │   │   ├── realtime/page.tsx  # Supabase Realtime demo (live collection)
│   │   │   │   └── components/page.tsx # Component showcase (all shadcn + admin components)
│   │   │   ├── contacts/              # ← EXAMPLE ENTITY (the pattern AI copies)
│   │   │   │   ├── loading.tsx        # List loading skeleton
│   │   │   │   ├── page.tsx           # List view (data table + search + filters)
│   │   │   │   ├── new/page.tsx       # Create form
│   │   │   │   ├── [id]/page.tsx      # Detail/view
│   │   │   │   └── [id]/edit/page.tsx # Edit form
│   │   │   ├── users/                 # User management (admin only)
│   │   │   │   ├── page.tsx           # User list
│   │   │   │   └── [id]/page.tsx      # Edit user / assign role
│   │   │   ├── files/                 # File manager
│   │   │   │   └── page.tsx           # Browse, upload, delete files
│   │   │   └── settings/              # App settings
│   │   │       └── page.tsx
│   │   │
│   │   ├── api/                       # Next.js API routes
│   │   │   ├── admin/
│   │   │   │   └── invite/
│   │   │   │       └── route.ts       # Invite user (service role, admin only)
│   │   │   └── webhooks/
│   │   │       └── route.ts           # Example webhook handler (with HMAC signature verification)
│   │   │
│   │   └── layout.tsx                 # Root layout (providers, fonts, metadata)
│   │
│   ├── components/
│   │   ├── ui/                        # shadcn/ui primitives (button, input, dialog, etc.)
│   │   ├── admin/                     # Reusable admin-specific components
│   │   │   ├── data-table.tsx         # Generic data table (sorting, filtering, pagination)
│   │   │   ├── entity-form.tsx        # Form wrapper with validation + toast feedback
│   │   │   ├── stat-card.tsx          # Dashboard metric card
│   │   │   ├── file-upload.tsx        # Drag-and-drop file upload
│   │   │   ├── confirm-dialog.tsx     # Delete confirmation modal
│   │   │   ├── role-guard.tsx         # Component-level permission check
│   │   │   └── page-header.tsx        # Title + breadcrumb + action buttons
│   │   └── layout/
│   │       ├── admin-sidebar.tsx      # Collapsible sidebar with nav items
│   │       ├── admin-topbar.tsx       # User menu, notifications, search
│   │       ├── public-header.tsx      # Public site header
│   │       └── public-footer.tsx      # Public site footer
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts             # createBrowserClient() — uses NEXT_PUBLIC_SUPABASE_URL (browser)
│   │   │   ├── server.ts             # createServerClient() — uses SUPABASE_URL (localhost in dev, kong in prod)
│   │   │   ├── admin.ts              # createServiceRoleClient() — uses SUPABASE_URL + service role key
│   │   │   └── queries.ts            # Cached server queries (React.cache() wrapped)
│   │   ├── acl.ts                     # Role + permission definitions and checker
│   │   ├── hooks/
│   │   │   ├── use-auth.ts           # Auth state hook (user, role, loading)
│   │   │   ├── use-entity.ts         # Generic CRUD hooks (list, get, create, update, delete)
│   │   │   ├── use-realtime.ts      # Supabase Realtime subscription hook (INSERT/UPDATE/DELETE)
│   │   │   └── use-file-upload.ts    # Storage upload hook with progress
│   │   └── utils.ts                   # Formatting, cn(), general helpers
│   │
│   ├── types/
│   │   ├── database.ts               # Auto-generated: `supabase gen types typescript`
│   │   └── acl.ts                     # Role, Permission, and UserWithRole types
│   │
│   └── middleware.ts                  # Next.js middleware: session refresh + route protection
│
├── supabase/
│   ├── config.toml                    # Supabase CLI project config (project-id, db port, etc.)
│   ├── migrations/
│   │   ├── 00001_roles_and_profiles.sql    # Sets app.environment + user_profiles + user_roles tables
│   │   ├── 00002_contacts_example.sql      # Example entity: contacts table + Realtime publication
│   │   ├── 00003_rls_policies.sql          # Row Level Security for all tables
│   │   └── 00004_storage_buckets.sql       # Storage bucket setup + policies
│   └── seed.sql                       # Demo data: admin user, sample contacts, roles
│
├── docker/
│   ├── nextjs/
│   │   └── Dockerfile                 # Multi-stage Next.js build
│   └── supabase/
│       ├── .env.example               # Supabase env vars template
│       └── volumes/
│           └── api/
│               └── kong.yml           # Kong declarative config (API gateway routes)
│
├── next.config.ts                     # Next.js config (output: 'standalone' for Docker)
├── docker-compose.yml                 # Full dev stack (Supabase + Next.js)
├── docker-compose.prod.yml            # Production overrides (no Studio, optimized)
├── Taskfile.yml                       # All dev/build/deploy commands
├── .env.example                       # App-level env vars template
├── setup.sh                           # One-command dev setup script
└── README.md                          # Getting started + conventions guide
```

---

## Database Schema

### Core Tables

These ship with every project and should rarely need modification.

#### `user_profiles`

Extends Supabase Auth's `auth.users` with app-specific data. Created automatically via a database trigger on user signup.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` PK | References `auth.users(id)` ON DELETE CASCADE |
| `full_name` | `text` | Display name |
| `avatar_url` | `text` | Path in Supabase Storage |
| `role` | `text` | `admin`, `editor`, or `viewer` — default `viewer`, `CHECK (role IN ('admin', 'editor', 'viewer'))` |
| `created_at` | `timestamptz` | Auto-set |
| `updated_at` | `timestamptz` | Auto-updated via trigger |

#### `app_settings`

Key-value store for app-level configuration (site name, logo, etc.).

| Column | Type | Notes |
|--------|------|-------|
| `key` | `text` PK | Setting identifier |
| `value` | `jsonb` | Flexible value storage |
| `updated_at` | `timestamptz` | Auto-updated |

### Example Entity: `contacts`

This is the reference entity that demonstrates the full CRUD pattern. When AI tools or developers need to add a new entity (products, orders, pets, players), they follow this pattern.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` PK | Default `gen_random_uuid()` |
| `name` | `text` | Required |
| `email` | `text` | Optional, unique when present |
| `phone` | `text` | Optional |
| `company` | `text` | Optional |
| `notes` | `text` | Freeform notes |
| `avatar_url` | `text` | Path in storage |
| `created_by` | `uuid` FK | References `user_profiles(id)` ON DELETE SET NULL (nullable) |
| `created_at` | `timestamptz` | Auto-set |
| `updated_at` | `timestamptz` | Auto-updated via trigger |

### RLS Policies

Every table gets these baseline policies. The pattern is consistent so AI can replicate it:

| Policy | Rule |
|--------|------|
| **Select** | Authenticated users can read all rows |
| **Insert** | Users with `admin` or `editor` role can insert |
| **Update** | Users with `admin` or `editor` role can update |
| **Delete** | Only `admin` can delete |

**`user_profiles` has stricter policies (security-critical):**

| Policy | Rule |
|--------|------|
| **Select** | Authenticated users can read all rows |
| **Insert** | `USING (false)` — only the `on_auth_user_created` trigger can insert (bypasses RLS as trigger owner) |
| **Update** | Users can update their own row, but a `BEFORE UPDATE` trigger prevents non-admins from changing the `role` column |
| **Delete** | `USING (false)` — profiles are cascade-deleted when auth.users are deleted |

```sql
-- Prevent non-admin role escalation
CREATE OR REPLACE FUNCTION public.prevent_role_change()
RETURNS trigger AS $$
BEGIN
  IF NEW.role != OLD.role AND public.get_user_role() != 'admin' THEN
    RAISE EXCEPTION 'Only admins can change user roles';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER guard_role_change
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_role_change();
```

Role checking uses a database function:

```sql
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text AS $$
  SELECT role FROM public.user_profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;
```

RLS policies reference this function:

```sql
CREATE POLICY "editors_can_insert" ON public.contacts
  FOR INSERT TO authenticated
  WITH CHECK (public.get_user_role() IN ('admin', 'editor'));
```

### Database Triggers

Two triggers ship by default:

| Trigger | On | Action |
|---------|------|--------|
| `on_auth_user_created` | `auth.users` INSERT | Creates a `user_profiles` row with default role `viewer` |
| `set_updated_at` | Any table with `updated_at` | Sets `updated_at = now()` before UPDATE |

---

## Auth & ACL

### Authentication Flow

Auth is handled entirely by Supabase GoTrue. The Next.js app never stores passwords or manages sessions directly.

| Action | Implementation |
|--------|---------------|
| Login | `supabase.auth.signInWithPassword()` — email + password |
| Register | `supabase.auth.signUp()` — or invite-only via admin |
| Forgot password | `supabase.auth.resetPasswordForEmail()` |
| Session refresh | Next.js middleware calls `supabase.auth.getUser()` on every request |
| Logout | `supabase.auth.signOut()` — clears cookies |
| OAuth (optional) | Google, GitHub etc. — configurable in Supabase dashboard |

### Invite Flow

Admins can invite users from `/admin/users`. This uses a Next.js API route at `src/app/api/admin/invite/route.ts` that:

1. Extracts the current user from the session using `createServerClient()`
2. Verifies the user has `role = 'admin'` by querying `user_profiles` — returns 403 otherwise
3. Only then uses the service role client from `src/lib/supabase/admin.ts` to call `supabase.auth.admin.inviteUserByEmail()`

The service role key is never exposed to the client. The admin check is mandatory — without it, any authenticated user could invoke the invite endpoint.

### ACL: Role-Based Permissions

Three default roles. The permissions map lives in `src/lib/acl.ts`:

```typescript
export const roles = ['admin', 'editor', 'viewer'] as const;
export type Role = typeof roles[number];

export type Permission =
  | 'dashboard.read'
  | 'contacts.read' | 'contacts.write' | 'contacts.delete'
  | 'files.read'    | 'files.write'    | 'files.delete'
  | 'users.read'    | 'users.write'
  | 'settings.read' | 'settings.write';

const rolePermissions: Record<Role, Permission[] | 'all'> = {
  admin:  'all',  // Admin has all permissions
  editor: [
    'dashboard.read',
    'contacts.read', 'contacts.write',
    'files.read', 'files.write',
  ],
  viewer: [
    'dashboard.read',
    'contacts.read',
    'files.read',
  ],
};

export function can(role: Role, permission: Permission): boolean {
  const perms = rolePermissions[role];
  if (perms === 'all') return true;
  return perms.includes(permission);
}
```

This is enforced at two layers:

| Layer | How |
|-------|-----|
| **UI** | `<RoleGuard permission="contacts.write">` hides buttons/sections the user can't use |
| **Database** | RLS policies use `get_user_role()` to enforce the same rules server-side |

The UI layer is cosmetic (better UX). The RLS layer is the actual security boundary.

### Next.js Middleware

`src/middleware.ts` runs on every request and handles:

1. Refreshing the Supabase auth session (cookie-based via `@supabase/ssr`) — **Note:** Next.js 15 made `cookies()` async, so all usages must use `await cookies()`
2. Redirecting unauthenticated users from `/admin/*` to `/login`
3. Redirecting authenticated users away from `/login` and `/register` to `/admin`
4. Allowing all public routes to pass through

```typescript
// Simplified logic
export async function middleware(request: NextRequest) {
  const supabase = createServerClient(/* cookies */);
  const { data: { user } } = await supabase.auth.getUser();

  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin');
  const isAuthRoute = ['/login', '/register', '/forgot-password'].includes(request.nextUrl.pathname);

  if (isAdminRoute && !user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  // /reset-password always passes through (needs recovery session from email link)
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/login', '/register', '/forgot-password', '/reset-password'],
};
```

---

## Server Query Caching

Shared server-side queries that may be called multiple times during a single request (e.g., from both layout and page) are wrapped with `React.cache()` for per-request deduplication. This lives in `src/lib/supabase/queries.ts`:

```typescript
import { cache } from 'react';
import { createServerClient } from './server';

// Deduplicated per request — safe to call from layout + page + components
export const getUser = cache(async () => {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
});

export const getUserRole = cache(async () => {
  const user = await getUser();
  if (!user) return null;
  const supabase = await createServerClient();
  const { data } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  return data?.role ?? null;
});
```

`React.cache()` is scoped to a single server render pass — no stale data across requests, no manual invalidation needed.

---

## Admin Panel Features

### Dashboard (`/admin`)

A landing page with stat cards showing key metrics. The template ships with generic widgets that adapt to whatever entity exists:

| Widget | Data Source | Example |
|--------|-----------|---------|
| Total records | Count query on primary entity | "847 contacts" |
| Created this week | Filtered count with date range | "+23 this week" |
| Active users | Count on `user_profiles` | "5 team members" |
| Storage used | Supabase Storage API | "1.2 GB / 5 GB" |

Stat cards use the `<StatCard>` component from `src/components/admin/stat-card.tsx`.

**Performance:** Dashboard stats are independent queries — fetch them in parallel with `Promise.all()` to avoid sequential waterfalls:

```typescript
// src/app/admin/page.tsx (Server Component)
const [totalContacts, weekContacts, activeUsers, storageUsed] = await Promise.all([
  supabase.from('contacts').select('*', { count: 'exact', head: true }),
  supabase.from('contacts').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo),
  supabase.from('user_profiles').select('*', { count: 'exact', head: true }),
  supabase.storage.getBucket('documents'),
]);
```

### Data Table (`/admin/contacts`)

The list view uses a generic `<DataTable>` component built on `@tanstack/react-table` + shadcn/ui's table components. Features out of the box:

- Server-side pagination (Supabase `.range()`)
- Column sorting (Supabase `.order()`)
- Search (Supabase `.ilike()` or `.textSearch()`)
- Column visibility toggle
- Row actions dropdown (view, edit, delete)
- Bulk selection + bulk delete
- Empty state

### Entity Forms (`/admin/contacts/new` and `/admin/contacts/[id]/edit`)

Forms use `react-hook-form` + `zod` for validation + shadcn/ui form components. The template includes a reusable pattern:

1. Define a Zod schema matching the database columns
2. Create the form with `useForm()` and the schema
3. Submit calls `supabase.from('contacts').insert()` or `.update()`
4. Toast notification on success/failure
5. Redirect back to list

### File Manager (`/admin/files`)

Browse, upload, and delete files in Supabase Storage. Uses the `<FileUpload>` component with drag-and-drop support. Files are organized in buckets (e.g., `avatars`, `documents`).

### User Management (`/admin/users`)

Admin-only section for managing team members:

- List all users with their roles
- Invite new users by email
- Change a user's role
- Deactivate users (soft delete via Supabase Auth)

### Settings (`/admin/settings`)

Key-value settings stored in `app_settings`. The template includes a simple form for:

- App name
- Logo upload
- Primary color / theme

---

## Demo Pages

The template ships with three demo pages under `/admin/demo/` that showcase the template's capabilities. These serve as interactive documentation — developers and AI tools can reference the code to understand patterns, and client stakeholders can see what the template can do out of the box. All three pages are linked from the admin sidebar under a "Demo" section.

### Role-Based UI Demo (`/admin/demo/roles`)

A single page that demonstrates the ACL system by rendering different UI based on the logged-in user's role. The user can see exactly what each role grants access to.

**Layout:**

The page is split into three visual columns (one per role: admin, editor, viewer). Each column shows which UI elements are visible for that role, with the current user's column highlighted.

**Sections on the page:**

| Section | What It Shows |
|---------|--------------|
| **Current user info** | Logged-in user's email, role badge, and avatar at the top of the page |
| **Permission matrix** | A table of all permissions (`contacts.read`, `contacts.write`, `contacts.delete`, etc.) with checkmarks per role |
| **Conditional UI blocks** | Three `<RoleGuard>` wrapped blocks showing real UI that appears/disappears per role |
| **Action buttons** | Buttons for create, edit, delete — each wrapped in `<RoleGuard>` with the appropriate permission |
| **Quick switch** | Buttons to sign in as each seed user (admin/editor/viewer) — only rendered when `NEXT_PUBLIC_DEMO_MODE=true` (env-gated, never in production) |

**Implementation details:**

```typescript
'use client';

// Each block demonstrates a different RoleGuard pattern
<Card>
  <CardHeader><CardTitle>Admin-Only Section</CardTitle></CardHeader>
  <CardContent>
    <RoleGuard permission="users.write">
      <p>✅ You can see this because you have users.write permission</p>
      <Button>Manage Users</Button>
      <Button variant="destructive">Delete User</Button>
    </RoleGuard>
    <RoleGuard permission="users.write" fallback={
      <p className="text-muted-foreground">🔒 This section requires admin access</p>
    }>
      {/* Shows fallback for non-admins */}
    </RoleGuard>
  </CardContent>
</Card>

// Permission matrix built from acl.ts
const allPermissions = [
  'dashboard.read', 'contacts.read', 'contacts.write', 'contacts.delete',
  'files.read', 'files.write', 'files.delete', 'users.read', 'users.write',
  'settings.read', 'settings.write',
] as const;

{allPermissions.map((perm) => (
  <TableRow key={perm}>
    <TableCell>{perm}</TableCell>
    {roles.map((role) => (
      <TableCell key={role}>
        {can(role, perm) ? <Badge variant="default">✓</Badge> : <Badge variant="outline">—</Badge>}
      </TableCell>
    ))}
  </TableRow>
))}
```

**Key `<RoleGuard>` patterns demonstrated:**

| Pattern | Example |
|---------|---------|
| Simple hide | `<RoleGuard permission="contacts.delete"><Button>Delete</Button></RoleGuard>` |
| With fallback | `<RoleGuard permission="users.write" fallback={<LockedMessage />}>...</RoleGuard>` |
| Inline check | `{can(role, 'settings.write') && <SettingsForm />}` |
| Disable instead of hide | `<Button disabled={!can(role, 'contacts.write')}>Edit</Button>` |

### Realtime Demo (`/admin/demo/realtime`)

A live demo page showing Supabase Realtime subscriptions in action. Uses the `contacts` table as the data source so it works with the existing seed data.

**What the page shows:**

| Element | Behavior |
|---------|----------|
| **Live contact list** | A card grid of contacts that updates in real-time — no page refresh needed |
| **Activity feed** | A scrolling log panel showing every INSERT, UPDATE, DELETE event as it happens, with timestamps |
| **"Add Random Contact" button** | Inserts a fake contact to trigger a live INSERT event |
| **Inline edit** | Click a contact card to edit the name inline — triggers a live UPDATE event across all connected clients |
| **Delete button** | Remove a contact — triggers a live DELETE event |
| **Connected clients indicator** | Shows how many browser tabs/users are currently subscribed (using Realtime Presence) |

**Implementation details:**

The page uses a custom `useRealtime` hook that wraps Supabase's channel subscription:

```typescript
// src/lib/hooks/use-realtime.ts
'use client';

import { useEffect, useState, startTransition } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

// Module-level singleton — stable reference, no re-renders
const supabase = createBrowserClient();

type RealtimeEvent = {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: Record<string, unknown>;
  old: Record<string, unknown>;
  timestamp: string;
};

export function useRealtime<T extends Record<string, unknown>>(
  table: string,
  initialData: T[],
) {
  const [data, setData] = useState<T[]>(initialData);
  const [events, setEvents] = useState<RealtimeEvent[]>([]);

  useEffect(() => {
    const channel = supabase
      .channel(`${table}-changes`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        (payload: RealtimePostgresChangesPayload<T>) => {
          // startTransition marks these updates as non-urgent, keeping UI responsive
          // during rapid Realtime event bursts
          startTransition(() => {
            const event: RealtimeEvent = {
              eventType: payload.eventType,
              new: payload.new as Record<string, unknown>,
              old: payload.old as Record<string, unknown>,
              timestamp: new Date().toISOString(),
            };
            setEvents((prev) => [event, ...prev].slice(0, 50)); // Keep last 50

            switch (payload.eventType) {
              case 'INSERT':
                setData((prev) => [payload.new as T, ...prev]);
                break;
              case 'UPDATE':
                setData((prev) =>
                  prev.map((row) =>
                    (row as any).id === (payload.new as any).id ? (payload.new as T) : row
                  )
                );
                break;
              case 'DELETE':
                setData((prev) =>
                  prev.filter((row) => (row as any).id !== (payload.old as any).id)
                );
                break;
            }
          });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [table]); // supabase is module-level singleton, no need in deps

  return { data, events };
}
```

**Page layout:**

```
┌─────────────────────────────────────────────────────────────┐
│  Realtime Demo                              [2 connected]   │
├──────────────────────────────┬──────────────────────────────┤
│                              │                              │
│  Live Contacts               │  Activity Feed               │
│  ┌────────┐ ┌────────┐      │  ● INSERT  John Doe  12:03   │
│  │ Card 1 │ │ Card 2 │      │  ● UPDATE  Jane S.   12:02   │
│  └────────┘ └────────┘      │  ● DELETE  Old User  12:01   │
│  ┌────────┐ ┌────────┐      │  ● INSERT  New Guy   12:00   │
│  │ Card 3 │ │ Card 4 │      │  ...                         │
│  └────────┘ └────────┘      │                              │
│                              │                              │
│  [+ Add Random Contact]     │                              │
├──────────────────────────────┴──────────────────────────────┤
│  Tip: Open this page in two browser tabs to see changes     │
│  sync live across both.                                     │
└─────────────────────────────────────────────────────────────┘
```

**Supabase Realtime requirements:**

- Realtime must be enabled on the `contacts` table. Add to migration `00002_contacts_example.sql`:
  ```sql
  ALTER PUBLICATION supabase_realtime ADD TABLE public.contacts;
  ```
- The `realtime` service must be running (included in the docker-compose service list)
- RLS policies apply to Realtime — users only receive events for rows they can SELECT

**Presence (connected clients indicator):**

```typescript
// Track connected clients using Supabase Presence (in a useEffect with cleanup)
// useRef guards against edge cases where cleanup hasn't run yet (e.g., StrictMode rapid remount)
const [presenceCount, setPresenceCount] = useState(0);
const initialized = useRef(false);

useEffect(() => {
  if (initialized.current) return; // Guard against rapid remount before cleanup runs
  initialized.current = true;

  const channel = supabase.channel('demo-presence');

  channel
    .on('presence', { event: 'sync' }, () => {
      setPresenceCount(Object.keys(channel.presenceState()).length);
    })
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({ user_id: user.id, online_at: new Date().toISOString() });
      }
    });

  return () => {
    initialized.current = false;
    supabase.removeChannel(channel);
  }; // Cleanup on unmount
}, [user.id]);
```

### Component Showcase (`/admin/demo/components`)

A living style guide / component catalogue that renders every shadcn/ui primitive and admin-specific component with interactive examples. This page serves three purposes:

1. **Visual reference** — see every component's look and feel without digging through code
2. **AI context** — AI tools can read this page's source to understand all available components
3. **Client demos** — show stakeholders the UI toolkit available for their project

**Page structure:**

The page uses a tab-based layout with one tab per category. Each component is shown in a card with a title, description, and live interactive example.

| Tab | Components Shown |
|-----|-----------------|
| **Inputs** | `Button` (all variants: default, destructive, outline, secondary, ghost, link + sizes), `Input`, `Textarea`, `Select`, `Checkbox`, `Switch`, `Form` (complete form with validation) |
| **Feedback** | `Toast` (success, error, action toasts via sonner), `Badge` (default, secondary, destructive, outline), `Skeleton` (loading states), `Progress` (determinate + indeterminate) |
| **Overlay** | `Dialog`, `Alert Dialog` (destructive confirmation), `Sheet` (slide-over panel), `Dropdown Menu` (with icons, separators, sub-menus), `Popover`, `Tooltip`, `Command` (search palette) |
| **Layout** | `Card`, `Table` (with example rows), `Tabs`, `Separator`, `Breadcrumb`, `Pagination`, `Avatar` |
| **Admin** | `DataTable` (with mock data, sorting, filtering, bulk select), `EntityForm` (create/edit form with validation), `StatCard` (metric cards), `FileUpload` (drag-and-drop zone), `ConfirmDialog` (delete confirmation), `RoleGuard` (permission gate), `PageHeader` (title + breadcrumbs + actions) |

**Example: Button variants section**

```typescript
<Card>
  <CardHeader>
    <CardTitle>Button</CardTitle>
    <CardDescription>Available button variants and sizes</CardDescription>
  </CardHeader>
  <CardContent className="space-y-4">
    <div className="flex flex-wrap gap-2">
      <Button variant="default">Default</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="link">Link</Button>
    </div>
    <div className="flex flex-wrap gap-2 items-center">
      <Button size="lg">Large</Button>
      <Button size="default">Default</Button>
      <Button size="sm">Small</Button>
      <Button size="icon"><Plus className="h-4 w-4" /></Button>
    </div>
    <div className="flex flex-wrap gap-2">
      <Button disabled>Disabled</Button>
      <Button><Loader2 className="mr-2 h-4 w-4 animate-spin" />Loading</Button>
    </div>
  </CardContent>
</Card>
```

**Example: DataTable in showcase**

```typescript
// Mock data for the DataTable showcase
const mockContacts = [
  { id: '1', name: 'Alice Johnson', email: 'alice@example.com', company: 'Acme Corp', created_at: '2024-01-15' },
  { id: '2', name: 'Bob Smith', email: 'bob@example.com', company: 'Globex', created_at: '2024-02-20' },
  // ... 8 more rows
];

<Card>
  <CardHeader>
    <CardTitle>DataTable</CardTitle>
    <CardDescription>Full-featured data table with sorting, filtering, pagination, and bulk actions</CardDescription>
  </CardHeader>
  <CardContent>
    <DataTable
      columns={showcaseColumns}
      data={mockContacts}
      searchColumn="name"
      pagination={{ page: 1, pageSize: 5, total: 10 }}
      onPageChange={() => {}}
      onSort={() => {}}
      bulkActions={[
        { label: 'Export', action: () => toast('Exported!'), variant: 'outline' },
        { label: 'Delete', action: () => toast('Deleted!'), variant: 'destructive' },
      ]}
    />
  </CardContent>
</Card>
```

**Example: Toast / Sonner showcase**

```typescript
<Card>
  <CardHeader>
    <CardTitle>Toast Notifications</CardTitle>
    <CardDescription>Feedback toasts via sonner</CardDescription>
  </CardHeader>
  <CardContent className="flex flex-wrap gap-2">
    <Button onClick={() => toast.success('Contact saved successfully')}>Success</Button>
    <Button variant="destructive" onClick={() => toast.error('Failed to delete contact')}>Error</Button>
    <Button variant="outline" onClick={() => toast('New contact added', {
      action: { label: 'Undo', onClick: () => toast('Undone!') }
    })}>With Action</Button>
    <Button variant="secondary" onClick={() => toast.promise(
      new Promise((resolve) => setTimeout(resolve, 2000)),
      { loading: 'Saving...', success: 'Saved!', error: 'Failed' }
    )}>Promise</Button>
  </CardContent>
</Card>
```

**Key conventions for the showcase page:**

| Convention | Rule |
|-----------|------|
| Each component gets its own `<Card>` | Title, description, live example |
| Interactive where possible | Buttons click, forms validate, dialogs open |
| Mock data only | No Supabase queries — all data is hardcoded in the component |
| `'use client'` | The entire page is a client component (interactive) |
| Source visible | Each card includes a "View Source" toggle that shows the JSX for that example |
| `content-visibility: auto` | Apply to each showcase card section for rendering performance — skips paint for off-screen cards |

**Rendering performance:** Both the component showcase (many cards) and the DataTable (many rows) benefit from CSS `content-visibility: auto` which tells the browser to skip rendering off-screen content until scrolled into view:

```css
/* In component showcase and data table containers */
.showcase-card, .data-table-row-group {
  content-visibility: auto;
  contain-intrinsic-size: auto 200px; /* estimated height to prevent layout shift */
}
```

### Demo Sidebar Navigation

The admin sidebar (`admin-sidebar.tsx`) includes a "Demo" section at the bottom, visually separated from the main nav:

```typescript
// In admin-sidebar.tsx nav items
{
  section: 'Demo',
  items: [
    { label: 'Role Demo', href: '/admin/demo/roles', icon: Shield },
    { label: 'Realtime', href: '/admin/demo/realtime', icon: Radio },
    { label: 'Components', href: '/admin/demo/components', icon: LayoutGrid },
  ],
}
```

### ACL Permissions for Demo Pages

Demo pages are read-only and visible to all authenticated roles. Update `src/lib/acl.ts`:

1. Add `| 'demo.read'` to the `Permission` type union
2. Append `'demo.read'` to the `editor` permissions array
3. Append `'demo.read'` to the `viewer` permissions array
4. `admin` gets it automatically via the `'all'` shorthand

---

## shadcn/ui Component Library

The template ships with a curated set of shadcn/ui components pre-installed in `src/components/ui/`. These are the building blocks that all admin-specific components compose from. Install them during project setup via `npx shadcn@latest add <component>`.

### Pre-installed shadcn/ui Primitives

| Component | File | Used By |
|-----------|------|---------|
| `button` | `ui/button.tsx` | Forms, actions, navigation, toolbars |
| `input` | `ui/input.tsx` | All form fields |
| `label` | `ui/label.tsx` | Form field labels |
| `textarea` | `ui/textarea.tsx` | Notes/description fields |
| `select` | `ui/select.tsx` | Dropdowns (role picker, filters) |
| `checkbox` | `ui/checkbox.tsx` | Bulk selection in data tables |
| `switch` | `ui/switch.tsx` | Boolean settings toggles |
| `dialog` | `ui/dialog.tsx` | Confirm dialogs, modals |
| `alert-dialog` | `ui/alert-dialog.tsx` | Destructive action confirmations (delete) |
| `dropdown-menu` | `ui/dropdown-menu.tsx` | Row actions, user menu |
| `table` | `ui/table.tsx` | Data table rendering |
| `card` | `ui/card.tsx` | Stat cards, settings panels |
| `badge` | `ui/badge.tsx` | Status indicators, role labels |
| `avatar` | `ui/avatar.tsx` | User avatars in topbar, user list |
| `separator` | `ui/separator.tsx` | Visual dividers in sidebar, forms |
| `skeleton` | `ui/skeleton.tsx` | Loading states |
| `toast` / `sonner` | `ui/sonner.tsx` | Toast notifications (success/error) |
| `form` | `ui/form.tsx` | react-hook-form + zod integration wrapper |
| `popover` | `ui/popover.tsx` | Date pickers, filter popovers |
| `command` | `ui/command.tsx` | Search/command palette |
| `sidebar` | `ui/sidebar.tsx` | Admin sidebar shell |
| `breadcrumb` | `ui/breadcrumb.tsx` | Page header navigation |
| `pagination` | `ui/pagination.tsx` | Data table pagination controls |
| `progress` | `ui/progress.tsx` | File upload progress indicator |
| `tooltip` | `ui/tooltip.tsx` | Icon button hints, truncated text |
| `tabs` | `ui/tabs.tsx` | Settings pages, entity detail views |
| `sheet` | `ui/sheet.tsx` | Mobile sidebar, slide-over panels |

### Admin-Specific Composed Components

These live in `src/components/admin/` and compose the shadcn primitives into reusable patterns.

**Bundle optimization:** `DataTable`, `EntityForm`, and `FileUpload` are heavy components (they pull in `@tanstack/react-table`, `react-hook-form`, and file handling logic respectively). Use `next/dynamic` for lazy loading when they appear below the fold or behind user interaction:

```typescript
import dynamic from 'next/dynamic';

const DataTable = dynamic(() => import('@/components/admin/data-table'), {
  loading: () => <Skeleton className="h-96 w-full" />,
});

const EntityForm = dynamic(() => import('@/components/admin/entity-form'), {
  loading: () => <Skeleton className="h-64 w-full" />,
});

const FileUpload = dynamic(() => import('@/components/admin/file-upload'));
```

#### `data-table.tsx`

Generic, config-driven data table built on `@tanstack/react-table` + shadcn `<Table>`.

```typescript
// Usage pattern — each entity page passes column definitions and a Supabase query
<DataTable
  columns={contactColumns}        // ColumnDef[] from @tanstack/react-table
  data={contacts}                 // Row data from Supabase query
  searchColumn="name"             // Column to filter via search input
  pagination={{ page, pageSize, total }}
  onPageChange={setPage}
  onSort={setSort}
  bulkActions={[                  // Optional bulk action buttons
    { label: 'Delete', action: handleBulkDelete, variant: 'destructive' }
  ]}
/>
```

Composed from: `table`, `input`, `button`, `checkbox`, `dropdown-menu`, `pagination`, `skeleton`

#### `entity-form.tsx`

Form wrapper that handles the react-hook-form + zod + toast pattern consistently.

```typescript
// Usage pattern — wraps any entity create/edit form
// Fields are passed as children via render prop (receives the form instance)
<EntityForm
  schema={contactSchema}          // Zod schema
  defaultValues={contact}         // Pre-fill for edit, undefined for create
  onSubmit={async (data) => {     // Handles insert or update
    await supabase.from('contacts').upsert(data)
  }}
  onSuccess={() => router.push('/admin/contacts')}
  submitLabel="Save Contact"
>
  {(form) => (
    <>
      <FormField control={form.control} name="name" render={({ field }) => (
        <FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
      )} />
      <FormField control={form.control} name="email" render={({ field }) => (
        <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
      )} />
      {/* ... additional fields follow the same pattern */}
    </>
  )}
</EntityForm>
```

Composed from: `form`, `input`, `label`, `textarea`, `select`, `button`, `sonner`

#### `stat-card.tsx`

Dashboard metric card with label, value, and optional trend indicator.

```typescript
<StatCard
  title="Total Contacts"
  value={847}
  trend={{ value: 23, label: "this week", direction: "up" }}
  icon={Users}                    // lucide-react icon
/>
```

Composed from: `card`

#### `file-upload.tsx`

Drag-and-drop file upload with progress indicator and Supabase Storage integration.

```typescript
<FileUpload
  bucket="avatars"
  accept="image/*"
  maxSize={5 * 1024 * 1024}       // 5MB
  onUpload={(path) => setValue('avatar_url', path)}
/>
```

Composed from: `card`, `button`, `progress`, `input` (file)

#### `confirm-dialog.tsx`

Reusable delete/destructive action confirmation.

```typescript
<ConfirmDialog
  title="Delete contact?"
  description="This action cannot be undone."
  onConfirm={handleDelete}
  variant="destructive"
/>
```

Composed from: `alert-dialog`, `button`

#### `role-guard.tsx`

Component-level permission gate. Hides children if the current user lacks the required permission.

```typescript
<RoleGuard permission="contacts.delete">
  <Button variant="destructive" onClick={handleDelete}>Delete</Button>
</RoleGuard>
```

Uses: `useAuth` hook + `can()` from `src/lib/acl.ts`

#### `page-header.tsx`

Consistent page header with title, breadcrumbs, and action buttons.

```typescript
<PageHeader
  title="Contacts"
  breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Contacts' }]}
  actions={
    <RoleGuard permission="contacts.write">
      <Button asChild><Link href="/admin/contacts/new">Add Contact</Link></Button>
    </RoleGuard>
  }
/>
```

Composed from: `breadcrumb`, `button`

### Layout Components

These live in `src/components/layout/`:

| Component | Purpose | Composed From |
|-----------|---------|---------------|
| `admin-sidebar.tsx` | Collapsible sidebar with nav items, logo, collapse toggle | `sidebar`, `button`, `separator`, `tooltip`, `sheet` (mobile) |
| `admin-topbar.tsx` | Top bar with user avatar, dropdown menu (profile, logout), search | `avatar`, `dropdown-menu`, `button`, `command` |
| `public-header.tsx` | Public site header with nav links | `button` |
| `public-footer.tsx` | Public site footer | — |

### Setup Command

Install all required shadcn components in one command during project initialization:

```bash
npx shadcn@latest add button input label textarea select checkbox switch \
  dialog alert-dialog dropdown-menu table card badge avatar separator \
  skeleton sonner form popover command sidebar breadcrumb pagination \
  progress tooltip tabs sheet
```

This command was run once during template creation. Components are committed to the repo and available immediately after cloning — no install step needed. They can be customized per client.

### Theming

shadcn/ui theming is controlled via CSS variables in `src/app/globals.css`. The template ships with a neutral default theme. Per-client customization:

1. Update CSS variables in `globals.css` (primary color, radius, etc.)
2. Or use the [shadcn themes tool](https://ui.shadcn.com/themes) to generate a theme and paste the variables

The `app_settings` table stores the client's preferred app name and logo, but color theming is done at the CSS level during project setup.

---

## The Example Entity Pattern

This is the most important part of the template. The `contacts` entity serves as a copyable pattern. When a developer (or AI) needs to add a new entity like `products`, they replicate this structure:

### Files to create per entity

| File | Purpose |
|------|---------|
| `supabase/migrations/XXXXX_products.sql` | Table, indexes, RLS policies |
| `src/app/admin/products/page.tsx` | List view with DataTable |
| `src/app/admin/products/new/page.tsx` | Create form |
| `src/app/admin/products/[id]/page.tsx` | Detail view |
| `src/app/admin/products/[id]/edit/page.tsx` | Edit form |
| `src/types/database.ts` | Regenerate with `supabase gen types typescript` |

### Files to modify per entity

| File | Change |
|------|--------|
| `src/components/layout/admin-sidebar.tsx` | Add nav item |
| `src/lib/acl.ts` | Add `products.read`, `products.write`, `products.delete` permissions |

This pattern is documented in the README with a step-by-step "Adding a new entity" guide, written to be both human-readable and AI-promptable.

---

## Docker & Infrastructure

### Dev Environment (`docker-compose.yml`)

Single `docker-compose.yml` runs the entire stack:

Docker-compose uses the **official Supabase short service names** (matching the [Supabase self-hosting docker-compose](https://github.com/supabase/supabase/tree/master/docker)). Container names use the `supabase-` prefix via `container_name`.

| Service | Image/Build | Ports | Purpose |
|---------|-------------|-------|---------|
| `db` | `supabase/postgres` | 127.0.0.1:5432 | PostgreSQL database |
| `auth` | `supabase/gotrue` | — | Authentication (internal) |
| `rest` | `postgrest/postgrest` | — | REST API (internal) |
| `realtime` | `supabase/realtime` | — | Realtime subscriptions |
| `storage` | `supabase/storage-api` | — | File storage |
| `imgproxy` | `darthsim/imgproxy` | — | Image transformation proxy (required by storage) |
| `meta` | `supabase/postgres-meta` | — | DB metadata API |
| `kong` | `kong` | 127.0.0.1:8000 | API gateway — requires `kong.yml` declarative config (dev only — **not exposed in production**) |
| `studio` | `supabase/studio` | 127.0.0.1:3001 | Developer dashboard (**dev only — excluded from prod compose**) |
| `nextjs` | Build from `./docker/nextjs/Dockerfile` | 3000 | The application (prod only — dev uses `npm run dev`) |

**Kong declarative config:** The `kong` service requires a volume-mounted `kong.yml` at `./docker/supabase/volumes/api/kong.yml` (copied from the [official Supabase repo](https://github.com/supabase/supabase/blob/master/docker/volumes/api/kong.yml)). This file defines routes for `/auth/v1/*`, `/rest/v1/*`, `/storage/v1/*`, and `/realtime/v1/*`. Without it, all API calls return 404. The Kong service needs:
- Volume mount: `./docker/supabase/volumes/api/kong.yml:/home/kong/temp.yml:ro`
- Env var: `KONG_DECLARATIVE_CONFIG=/home/kong/kong.yml`
- Custom entrypoint that resolves `${ANON_KEY}` and `${SERVICE_ROLE_KEY}` placeholders at startup:
  ```yaml
  entrypoint: bash -c 'eval "echo \"$$(cat ~/temp.yml)\"" > ~/kong.yml && /docker-entrypoint.sh kong docker-start'
  ```
  This is how the official Supabase compose handles it — `temp.yml` is the template, `kong.yml` is the resolved output.

**Minimal stack (no analytics):** The template uses a minimal Supabase stack **without** `analytics` (Logflare), `vector` (log routing), or `supavisor` (connection pooler). When building the docker-compose, do NOT copy `depends_on` conditions referencing `analytics` from the official Supabase compose — those services are omitted intentionally to keep the stack lightweight. If analytics logging is needed per-client, add those services from the official docker-compose.

All Supabase services communicate on an internal Docker network (`supabase-net`). The Next.js app connects to Kong on this network.

**Security:** All dev port mappings bind to `127.0.0.1` to prevent exposure on shared networks. In `docker-compose.prod.yml`:
- `studio` service is **excluded entirely** (no database admin UI in production)
- `kong` has **no port mapping** — only reachable from the internal Docker network via the Next.js container
- Only the `nextjs` service exposes port 3000 to the host
- The `nextjs` service sets `SUPABASE_URL=http://kong:8000` (overrides the dev default of `localhost:8000` since Next.js runs inside Docker in prod)

### Environment Variables

`.env.example` ships with the template and contains all required variables with comments:

The full `.env.example` is based on the [official Supabase self-hosting .env](https://github.com/supabase/supabase/blob/master/docker/.env.example) with additions for Next.js. Key sections:

```env
# ── Supabase URLs ────────────────────────────────
SUPABASE_URL=http://localhost:8000   # Server-side URL (localhost in dev; overridden to http://kong:8000 in docker-compose.prod.yml)
NEXT_PUBLIC_SUPABASE_URL=http://localhost:8000  # External URL (browser)
SUPABASE_PUBLIC_URL=http://localhost:8000       # Used by Studio and other services
API_EXTERNAL_URL=http://localhost:8000          # GoTrue external URL

# ── JWT / Auth Keys ─────────────────────────────
JWT_SECRET=<generated>                          # Shared across GoTrue, PostgREST, Kong
JWT_EXP=3600
ANON_KEY=<generated>                            # Used by Kong, PostgREST, Studio, Next.js
SERVICE_ROLE_KEY=<generated>                    # Used by Kong, PostgREST, Storage, Next.js
NEXT_PUBLIC_SUPABASE_ANON_KEY=<generated>       # Same as ANON_KEY (dotenv can't interpolate)
SUPABASE_SERVICE_ROLE_KEY=<generated>           # Same as SERVICE_ROLE_KEY

# ── Postgres ─────────────────────────────────────
POSTGRES_HOST=db
POSTGRES_PORT=5432
POSTGRES_DB=postgres
POSTGRES_PASSWORD=<generated>

# ── Auth (GoTrue) ────────────────────────────────
SITE_URL=http://localhost:3000
GOTRUE_EXTERNAL_EMAIL_ENABLED=true
GOTRUE_MAILER_AUTOCONFIRM=true                 # Dev only — disable in production
GOTRUE_SMTP_ADMIN_EMAIL=admin@example.com
GOTRUE_SMTP_HOST=inbucket                      # Dev mail server
GOTRUE_SMTP_PORT=2500
GOTRUE_SMTP_SENDER_NAME=MyApp

# ── Realtime ─────────────────────────────────────
SECRET_KEY_BASE=<generated>                     # Required — Realtime crashes without this

# ── Studio ───────────────────────────────────────
DASHBOARD_USERNAME=admin                        # Studio HTTP basic auth (dev)
DASHBOARD_PASSWORD=admin                        # Studio HTTP basic auth (dev)

# ── Storage ──────────────────────────────────────
STORAGE_BACKEND=file                            # 'file' for local, 's3' for production
GLOBAL_S3_BUCKET=stub                           # S3 bucket name (production only)
REGION=local                                    # AWS region for S3
STORAGE_TENANT_ID=stub                          # Tenant ID
S3_PROTOCOL_ACCESS_KEY_ID=<generated>           # MinIO/S3 access key
S3_PROTOCOL_ACCESS_KEY_SECRET=<generated>       # MinIO/S3 secret key
IMGPROXY_ENABLE_WEBP_DETECTION=true

# ── PostgREST ────────────────────────────────────
PGRST_DB_SCHEMAS=public,storage,graphql_public
PGRST_JWT_SECRET=${JWT_SECRET}                  # docker-compose interpolates this

# ── Kong ─────────────────────────────────────────
KONG_HTTP_PORT=8000

# ── Misc Secrets ─────────────────────────────────
VAULT_ENC_KEY=<generated>                       # Vault encryption key
PG_META_CRYPTO_KEY=<generated>                  # PG Meta encryption
LOGFLARE_API_KEY=<generated>                    # Analytics (can be random for self-hosted)

# ── Webhooks ─────────────────────────────────────
WEBHOOK_SECRET=<generated>                      # HMAC signature verification

# ── Next.js ──────────────────────────────────────
NEXT_PUBLIC_APP_NAME="My App"
NEXT_PUBLIC_DEMO_MODE=true                     # Enables demo Quick Switch (set to false in production)
```

**Note:** All `<generated>` values are automatically filled by `setup.sh`. The full list is derived from the official Supabase `.env.example` — consult it for additional options and documentation.

### Setup Script (`setup.sh`)

One command to go from clone to working dev environment:

```bash
#!/usr/bin/env bash
set -euo pipefail

echo "🚀 PHPro Vibe Starter — Dev Setup"
echo "=================================="

# 1. Check prerequisites
command -v docker >/dev/null 2>&1 || { echo "❌ Docker is required"; exit 1; }
command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required"; exit 1; }

# 2. Copy env file if not exists
if [ ! -f .env ]; then
  cp .env.example .env
  echo "📝 Created .env from .env.example"
  echo "   → Generating secrets..."

  # Generate random secrets and update .env
  JWT_SECRET=$(openssl rand -base64 32)
  POSTGRES_PASSWORD=$(openssl rand -base64 24)
  WEBHOOK_SECRET=$(openssl rand -base64 32)
  SECRET_KEY_BASE=$(openssl rand -base64 48)
  VAULT_ENC_KEY=$(openssl rand -hex 16)
  PG_META_CRYPTO_KEY=$(openssl rand -hex 16)
  LOGFLARE_API_KEY=$(openssl rand -hex 16)
  S3_ACCESS_KEY=$(openssl rand -hex 16)
  S3_SECRET_KEY=$(openssl rand -hex 32)

  # Generate Supabase JWT keys (anon + service_role are JWTs signed with the secret)
  ANON_KEY=$(node -e "
    const crypto = require('crypto');
    const header = Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url');
    const payload = Buffer.from(JSON.stringify({role:'anon',iss:'supabase',iat:Math.floor(Date.now()/1000),exp:Math.floor(Date.now()/1000)+60*60*24*365*10})).toString('base64url');
    const sig = crypto.createHmac('sha256','$JWT_SECRET').update(header+'.'+payload).digest('base64url');
    console.log(header+'.'+payload+'.'+sig);
  ")
  SERVICE_KEY=$(node -e "
    const crypto = require('crypto');
    const header = Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url');
    const payload = Buffer.from(JSON.stringify({role:'service_role',iss:'supabase',iat:Math.floor(Date.now()/1000),exp:Math.floor(Date.now()/1000)+60*60*24*365*10})).toString('base64url');
    const sig = crypto.createHmac('sha256','$JWT_SECRET').update(header+'.'+payload).digest('base64url');
    console.log(header+'.'+payload+'.'+sig);
  ")

  # Use perl for portable in-place editing (works on macOS + Linux)
  perl -pi -e "s|^JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|" .env
  # Replace all key placeholders (ANON_KEY, NEXT_PUBLIC_SUPABASE_ANON_KEY, etc.)
  # Use anchored regex to avoid cross-matching (^ ensures line start)
  perl -pi -e "s|^ANON_KEY=.*|ANON_KEY=$ANON_KEY|" .env
  perl -pi -e "s|^NEXT_PUBLIC_SUPABASE_ANON_KEY=.*|NEXT_PUBLIC_SUPABASE_ANON_KEY=$ANON_KEY|" .env
  perl -pi -e "s|^SERVICE_ROLE_KEY=.*|SERVICE_ROLE_KEY=$SERVICE_KEY|" .env
  perl -pi -e "s|^SUPABASE_SERVICE_ROLE_KEY=.*|SUPABASE_SERVICE_ROLE_KEY=$SERVICE_KEY|" .env
  perl -pi -e "s|^POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=$POSTGRES_PASSWORD|" .env
  perl -pi -e "s|^WEBHOOK_SECRET=.*|WEBHOOK_SECRET=$WEBHOOK_SECRET|" .env
  perl -pi -e "s|^SECRET_KEY_BASE=.*|SECRET_KEY_BASE=$SECRET_KEY_BASE|" .env
  perl -pi -e "s|^VAULT_ENC_KEY=.*|VAULT_ENC_KEY=$VAULT_ENC_KEY|" .env
  perl -pi -e "s|^PG_META_CRYPTO_KEY=.*|PG_META_CRYPTO_KEY=$PG_META_CRYPTO_KEY|" .env
  perl -pi -e "s|^LOGFLARE_API_KEY=.*|LOGFLARE_API_KEY=$LOGFLARE_API_KEY|" .env
  perl -pi -e "s|^S3_PROTOCOL_ACCESS_KEY_ID=.*|S3_PROTOCOL_ACCESS_KEY_ID=$S3_ACCESS_KEY|" .env
  perl -pi -e "s|^S3_PROTOCOL_ACCESS_KEY_SECRET=.*|S3_PROTOCOL_ACCESS_KEY_SECRET=$S3_SECRET_KEY|" .env

  echo "   ✅ Secrets generated"
fi

# 3. Install Node.js dependencies
echo "📦 Installing dependencies..."
npm install

# 4. Start Supabase stack
echo "🐳 Starting Supabase..."
docker compose up -d db auth rest realtime storage imgproxy meta kong studio

echo "⏳ Waiting for Supabase to be ready..."
until docker compose exec db pg_isready -U postgres > /dev/null 2>&1; do
  sleep 1
done

# 5. Run migrations and seed
echo "🗄️  Running migrations..."
# Using --db-url because we manage Supabase via custom docker-compose, not `supabase start`
npx supabase db push --db-url "postgresql://postgres:${POSTGRES_PASSWORD}@localhost:5432/postgres"

echo "🌱 Seeding database..."
# app.environment is set in migration 00001, so seed guard passes automatically
docker compose exec -T db psql -U postgres -d postgres < supabase/seed.sql

# 6. Generate TypeScript types
echo "📐 Generating TypeScript types..."
npx supabase gen types typescript --db-url "postgresql://postgres:${POSTGRES_PASSWORD}@localhost:5432/postgres" > src/types/database.ts

echo ""
echo "✅ Setup complete! Supabase is running."
echo ""
echo "   Studio:  http://localhost:3001"
echo ""
echo "   Default admin login:"
echo "   Email:    admin@example.com"
echo "   Password: admin123456"
echo ""
echo "   Run 'task dev:next' to start the Next.js dev server."
echo "   App:     http://localhost:3000"
echo "   Admin:   http://localhost:3000/admin"
```

---

## Taskfile

`Taskfile.yml` provides standardized commands for the entire workflow:

```yaml
version: '3'

dotenv: ['.env']

tasks:
  # ── Setup ──────────────────────────────────────
  setup:
    desc: "Full dev environment setup (first time)"
    cmds:
      - bash setup.sh

  # ── Development ────────────────────────────────
  dev:
    desc: "Start everything (Supabase + Next.js)"
    cmds:
      - docker compose up -d db auth rest realtime storage imgproxy meta kong studio
      - npm run dev

  dev:supabase:
    desc: "Start only Supabase stack"
    cmds:
      - docker compose up -d db auth rest realtime storage imgproxy meta kong studio

  dev:next:
    desc: "Start only Next.js dev server"
    cmds:
      - npm run dev

  dev:stop:
    desc: "Stop all services"
    cmds:
      - docker compose down

  # ── Database ───────────────────────────────────
  db:migrate:
    desc: "Run pending migrations"
    cmds:
      - npx supabase db push --db-url "postgresql://postgres:${POSTGRES_PASSWORD}@localhost:5432/postgres"

  db:new-migration:
    desc: "Create a new migration file"
    cmds:
      - npx supabase migration new {{.CLI_ARGS}}

  db:reset:
    desc: "Reset database and re-run all migrations + seed"
    cmds:
      - npx supabase db reset --db-url "postgresql://postgres:${POSTGRES_PASSWORD}@localhost:5432/postgres"

  db:seed:
    desc: "Run seed data"
    cmds:
      - docker compose exec -T db psql -U postgres -d postgres < supabase/seed.sql

  db:studio:
    desc: "Open Supabase Studio in browser"
    cmds:
      - open http://localhost:3001

  # ── Types ──────────────────────────────────────
  types:generate:
    desc: "Regenerate TypeScript types from database schema"
    cmds:
      - npx supabase gen types typescript --db-url "postgresql://postgres:${POSTGRES_PASSWORD}@localhost:5432/postgres" > src/types/database.ts
      - echo "✅ Types written to src/types/database.ts"

  # ── Entity Scaffolding ─────────────────────────
  entity:new:
    desc: "Show instructions for adding a new entity"
    cmds:
      - |
        echo ""
        echo "📋 Adding a new entity: {{.CLI_ARGS}}"
        echo "======================================="
        echo ""
        echo "1. Create migration:"
        echo "   task db:new-migration -- {{.CLI_ARGS}}"
        echo "   Then edit the SQL file in supabase/migrations/"
        echo ""
        echo "2. Copy the contacts pattern:"
        echo "   cp -r src/app/admin/contacts src/app/admin/{{.CLI_ARGS}}"
        echo ""
        echo "3. Update the copied files:"
        echo "   - Replace 'contacts' with '{{.CLI_ARGS}}' in all files"
        echo "   - Update the Zod schema to match your table"
        echo "   - Update the DataTable columns"
        echo ""
        echo "4. Add to sidebar:"
        echo "   Edit src/components/layout/admin-sidebar.tsx"
        echo ""
        echo "5. Add permissions to src/lib/acl.ts"
        echo ""
        echo "6. Run migration and regenerate types:"
        echo "   task db:migrate"
        echo "   task types:generate"
        echo ""

  # ── Code Quality ───────────────────────────────
  lint:
    desc: "Run ESLint"
    cmds:
      - npx eslint src/ --fix

  typecheck:
    desc: "Run TypeScript compiler check"
    cmds:
      - npx tsc --noEmit

  # ── Build ──────────────────────────────────────
  build:
    desc: "Build Next.js for production"
    cmds:
      - npm run build

  # ── Production (placeholder) ───────────────────
  prod:up:
    desc: "Start production stack (TODO)"
    cmds:
      - echo "Production deployment not yet configured"
      - echo "Will use docker-compose.prod.yml"

  # ── Utilities ──────────────────────────────────
  clean:
    desc: "Remove node_modules, .next, and Docker volumes"
    cmds:
      - rm -rf node_modules .next
      - docker compose down -v
      - echo "✅ Cleaned"

  logs:
    desc: "Tail all Docker container logs"
    cmds:
      - docker compose logs -f

  logs:supabase:
    desc: "Tail Supabase logs"
    cmds:
      - docker compose logs -f kong auth rest db
```

---

## Seed Data

`supabase/seed.sql` creates a usable starting state:

| What | Details |
|------|---------|
| Admin user | `admin@example.com` / `admin123456` with role `admin` |
| Editor user | `editor@example.com` / `editor123456` with role `editor` |
| Viewer user | `viewer@example.com` / `viewer123456` with role `viewer` |
| 20 sample contacts | Realistic fake data (names, emails, companies) |
| App settings | Default app name, placeholder logo |

**Important:** Seeding `auth.users` requires bcrypt-hashed passwords and specific GoTrue metadata columns. The seed SQL must use `crypt()` from the `pgcrypto` extension (enabled by default in Supabase).

**Security:** The seed file includes an environment guard at the top to prevent accidental execution in production:

```sql
-- Abort if not in development
DO $$ BEGIN
  IF current_setting('app.environment', true) IS DISTINCT FROM 'development' THEN
    RAISE EXCEPTION 'seed.sql must not run in production — set app.environment = development';
  END IF;
END $$;
```

Migration `00001_roles_and_profiles.sql` includes both:
```sql
ALTER DATABASE postgres SET app.environment = 'development';  -- persists for new sessions
SET app.environment = 'development';  -- applies to current session (needed for supabase db reset)
```
This ensures the seed guard passes in both `setup.sh` (separate psql session) and `task db:reset` (same connection for migrations + seed). Seed credentials (`admin@example.com` / `admin123456`) are **for development only**. The README must warn that production deployments require creating users via the invite flow or a custom setup script with strong passwords.

Seed user example:

```sql
-- Example: insert a seed user into auth.users (all required GoTrue columns)
DO $$
DECLARE
  user_id uuid := gen_random_uuid();
BEGIN
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    aud, role, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) VALUES (
    user_id,
    '00000000-0000-0000-0000-000000000000',
    'admin@example.com',
    crypt('admin123456', gen_salt('bf')),
    now(),
    'authenticated',
    'authenticated',
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Admin User"}'::jsonb,
    now(),
    now()
  );

  -- Required for signInWithPassword() to work (Supabase v2+)
  INSERT INTO auth.identities (
    id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
  ) VALUES (
    user_id,
    user_id,
    user_id::text,
    jsonb_build_object('sub', user_id::text, 'email', 'admin@example.com'),
    'email',
    now(),
    now(),
    now()
  );
END $$;

-- The on_auth_user_created trigger auto-creates the user_profiles row.
-- Then update the role to admin:
UPDATE public.user_profiles SET role = 'admin'
WHERE id = (SELECT id FROM auth.users WHERE email = 'admin@example.com');
```

---

## Developer Workflow

### First Time Setup

```bash
git clone <repo-url> my-client-project
cd my-client-project
task setup
```

That's it. The app is running at `localhost:3000`, admin at `localhost:3000/admin`, Studio at `localhost:3001`.

### Daily Development

```bash
task dev           # Start everything
task dev:stop      # Stop everything
```

### Adding a New Entity

1. Run `task db:new-migration -- products`
2. Write the SQL (copy structure from contacts migration)
3. Copy `src/app/admin/contacts` to `src/app/admin/products`
4. Adapt the copied files (schema, columns, labels)
5. Add nav item to sidebar
6. Add permissions to ACL
7. Run `task db:migrate && task types:generate`

This workflow is designed so that steps 2-6 can be done by prompting an AI tool: "Add a products entity with name, price, description, category, and image. Follow the contacts pattern."

### Key Conventions for AI-Friendliness

The template follows strict conventions so AI tools produce consistent code:

| Convention | Rule |
|-----------|------|
| File naming | Lowercase, kebab-case (`data-table.tsx`, not `DataTable.tsx`) |
| Entity routes | Always `/admin/{entity}`, `/admin/{entity}/new`, `/admin/{entity}/[id]`, `/admin/{entity}/[id]/edit` |
| Form validation | Always Zod schema + react-hook-form |
| API calls | Always `supabase.from('table')` — never raw SQL from the client |
| Components | shadcn/ui primitives, composed into admin-specific components |
| State | Server Components by default, `'use client'` only when needed (forms, interactive elements) |
| Server queries | Wrap shared Supabase server queries with `React.cache()` for per-request deduplication (e.g., `getUser`, `getUserRole`) |
| Error handling | Try/catch with toast notifications via sonner |
| Loading states | Every route segment with server-side data fetching gets a `loading.tsx` using `<Skeleton>` components — prevents blank pages during SSR |

---

## Tech Decisions & Rationale

| Decision | Why |
|----------|-----|
| Next.js over Vite SPA | Public pages need SSR/SEO; AI tools default to Next.js; one framework for everything |
| shadcn/ui over Material/Ant | Copy-paste components live in your codebase; AI tools understand them well; fully customizable |
| Self-hosted Supabase over cloud | Per-client isolation; data sovereignty for EU clients; no per-project SaaS cost |
| Taskfile over Make/scripts | Cross-platform, readable YAML, good docs, `task --list` shows all commands |
| Zod + react-hook-form | Type-safe validation that matches DB schema; shadcn/ui has built-in form integration |
| `@tanstack/react-table` | Headless, works with shadcn/ui, handles sorting/filtering/pagination without opinions on styling |
| Single role column over RBAC tables | KISS — three roles cover 95% of small client needs. Upgrade to a join table if a client needs it |

---

## Security Hardening

### Security Headers

`next.config.ts` must configure security headers via the `headers()` function:

| Header | Value | Purpose |
|--------|-------|---------|
| `X-Frame-Options` | `DENY` | Prevent clickjacking |
| `X-Content-Type-Options` | `nosniff` | Prevent MIME type sniffing |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Limit referrer leakage |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains` | Enforce HTTPS (production only) |
| `Content-Security-Policy` | Restrict `script-src`, `frame-ancestors none`, etc. | Prevent XSS and embedding |

### Webhook Signature Verification

The example webhook handler at `src/app/api/webhooks/route.ts` must include:

1. A `WEBHOOK_SECRET` env variable for HMAC verification
2. Verification of the `x-webhook-signature` header against the request body
3. Rejection with 401 if signature is missing or invalid

This is boilerplate that ships with the template — not optional.

### Rate Limiting

Configure GoTrue rate limiting in the docker-compose `auth` service environment:

```yaml
GOTRUE_RATE_LIMIT_EMAIL_SENT: "5"       # Max emails per hour per IP
GOTRUE_SECURITY_CAPTCHA_ENABLED: "false" # Enable if needed per-client
```

For Next.js API routes, consider adding a lightweight rate limiter middleware for `/api/*` endpoints.

### File Upload Validation

Storage bucket migrations (`00004_storage_buckets.sql`) must configure:

| Setting | Value | Purpose |
|---------|-------|---------|
| `allowed_mime_types` | Per bucket (e.g., `image/jpeg`, `image/png`, `application/pdf`) | Prevent arbitrary file uploads |
| `file_size_limit` | Per bucket (e.g., `10485760` for 10MB) | Prevent storage exhaustion |

Storage RLS policies restrict uploads to authenticated users with `editor` or `admin` role. Non-image file downloads should set `Content-Disposition: attachment` to prevent stored XSS via HTML uploads.

---

## Out of Scope (For Now)

These are explicitly not in v1 of the template but could be added per-client:

- Multi-language / i18n
- Dark mode (shadcn/ui supports it, just not pre-configured)
- Email templates / transactional emails
- Audit log / activity history
- Multi-tenancy within a single project
- Production deployment automation (`docker-compose.prod.yml` is a placeholder)
- CI/CD pipeline
- Automated testing setup

---

## Success Criteria

The template is "done" when:

1. `task setup` goes from fresh clone to working app in under 3 minutes
2. A developer can add a new CRUD entity in under 15 minutes by following the pattern
3. An AI tool (Cursor/Claude Code) can add a new entity from a single prompt by referencing the contacts example
4. The admin panel is usable by a non-technical client staff member without training
5. Each client deployment is fully isolated (own database, own auth, own storage)
