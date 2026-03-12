# Template Upgrade: Feature Architecture + Production Hardening

**Date:** 2026-03-12
**Status:** Approved

---

## Context

The PHPro Vibe Starter is a reusable Next.js 16 + Supabase template for spinning up B2B client projects. It currently scores ~6.6/10 on production readiness. This upgrade pushes it to ~8.5/10 by restructuring to feature-based architecture and adding seven concrete improvements.

**Constraints:**
- Solo dev (Stijn) maintaining 5–10 client projects
- Heavy AI-assisted coding (GSD, Claude Code, Cursor)
- One repo per client, cloned from this template
- Self-hosted Supabase per client
- No multi-tenant / no billing in the template

---

## 1. Feature-Based Folder Restructure

### Current state

Domain logic is scattered: queries in `lib/supabase/queries.ts`, hooks in `lib/hooks/`, contact-specific UI mixed into page files. Adding a new entity requires touching 6+ locations with no clear pattern.

### New structure

```
src/
├── features/
│   ├── auth/
│   │   ├── queries/
│   │   │   ├── get-current-user.ts    ← React.cache server query
│   │   │   └── get-user-role.ts
│   │   ├── actions/
│   │   │   ├── login.ts              ← "use server"
│   │   │   ├── register.ts
│   │   │   ├── forgot-password.ts
│   │   │   └── reset-password.ts
│   │   ├── components/
│   │   │   ├── login-form.tsx
│   │   │   └── register-form.tsx
│   │   └── types.ts
│   │
│   ├── contacts/                      ← EXAMPLE ENTITY
│   │   ├── queries/
│   │   │   ├── get-contacts.ts        ← server query, paginated
│   │   │   └── get-contact.ts         ← server query, by ID
│   │   ├── actions/
│   │   │   ├── create-contact.ts
│   │   │   ├── update-contact.ts
│   │   │   └── delete-contact.ts
│   │   ├── components/
│   │   │   ├── contact-columns.tsx    ← DataTable column defs
│   │   │   └── contact-form.tsx       ← Zod-validated form
│   │   └── types.ts                   ← Contact type + schemas
│   │
│   ├── users/
│   │   ├── queries/
│   │   ├── actions/
│   │   ├── components/
│   │   └── types.ts
│   │
│   ├── files/
│   │   ├── queries/
│   │   ├── actions/
│   │   ├── components/
│   │   └── types.ts
│   │
│   ├── notifications/                 ← NEW
│   │   ├── queries/
│   │   │   ├── get-notifications.ts
│   │   │   └── get-unread-count.ts
│   │   ├── actions/
│   │   │   ├── create-notification.ts
│   │   │   └── mark-as-read.ts
│   │   ├── components/
│   │   │   ├── notification-bell.tsx  ← topbar widget with Realtime
│   │   │   └── notification-list.tsx  ← full page list
│   │   └── types.ts
│   │
│   └── audit/                         ← NEW
│       ├── queries/
│       │   └── get-audit-logs.ts      ← filterable by action/entity/user/date
│       ├── actions/
│       │   └── log-action.ts          ← append-only helper
│       ├── components/
│       │   ├── audit-log-table.tsx
│       │   └── audit-detail.tsx       ← metadata diff view
│       └── types.ts
│
├── app/                               ← thin route wrappers only
│   ├── admin/
│   │   ├── audit/page.tsx             ← NEW
│   │   ├── notifications/page.tsx     ← NEW
│   │   └── ...existing routes
│   └── ...
│
├── components/                        ← shared UI, no domain logic
│   ├── ui/                            ← shadcn primitives (unchanged)
│   ├── admin/                         ← data-table, entity-form, error-boundary, etc.
│   └── layout/                        ← sidebar, topbar
│
├── lib/                               ← infrastructure only
│   ├── supabase/                      ← client.ts, server.ts, admin.ts
│   ├── acl.ts                         ← permission engine
│   ├── env.ts                         ← NEW: env validation
│   ├── hooks/                         ← use-entity.ts (generic), use-realtime.ts, etc.
│   └── utils.ts
│
└── types/
    ├── database.ts                    ← generated Supabase types
    └── acl.ts                         ← Role, Permission types
```

### Rules

1. `app/` pages are thin — they import from `features/` and compose components
2. `features/*/queries/` = server-side reads wrapped in `React.cache()`
3. `features/*/actions/` = `"use server"` functions for writes
4. `features/*/components/` = domain-specific UI (columns, forms)
5. `lib/` = shared infrastructure, never imports from `features/`
6. `components/` = reusable UI, no Supabase calls
7. `use-entity.ts` stays in `lib/hooks/` — it's generic infrastructure

### Migration plan

- `lib/supabase/queries.ts` → split into `features/auth/queries/`
- Contact logic extracted from page files → `features/contacts/`
- User management logic → `features/users/`
- File logic → `features/files/`
- Import paths updated across all consumers

---

## 2. Audit Logging System

### Database

```sql
CREATE TABLE audit_logs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action      text NOT NULL,
  entity_type text,
  entity_id   uuid,
  metadata    jsonb DEFAULT '{}',
  ip_address  text,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Admins see all, others see only own actions
CREATE POLICY "audit_logs_select" ON audit_logs FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- No INSERT/UPDATE/DELETE policies — inserts via service role (bypasses RLS)

CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
```

### RLS

- Admins can SELECT all rows; non-admins can only SELECT their own `user_id` rows
- No UPDATE or DELETE policies — append-only
- INSERT via service role only (bypasses RLS)

### Action naming convention

Format: `entity.verb` — e.g. `contact.created`, `contact.updated`, `contact.deleted`, `user.role_changed`, `setting.updated`

### Server helper

```ts
// features/audit/actions/log-action.ts
"use server"
export async function logAction(params: {
  action: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}): Promise<void>
```

Uses a dual-client pattern: creates an anon-key server client (which reads cookies) to call `auth.getUser()` for the `user_id`, then uses the service-role admin client for the INSERT (bypassing RLS). Reads IP from `(await headers()).get('x-forwarded-for')` — returns null in development. Requires trust in the reverse proxy (Kong, in this stack).

Called from other server actions after mutations.

### Admin UI

- Page at `/admin/audit` with DataTable
- Filters: action type, entity type, user, date range
- Detail view: shows `metadata` as old/new diff when available
- Sidebar entry (admin-only visibility via permission check)

---

## 3. Notifications System

### Database

```sql
CREATE TABLE notifications (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title      text NOT NULL,
  message    text,
  link       text,
  is_read    boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can only read their own notifications
CREATE POLICY "notifications_select" ON notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Users can only mark their own notifications as read
CREATE POLICY "notifications_update" ON notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- No INSERT policy — inserts via service role (bypasses RLS)

CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read, created_at DESC);
```

Table added to Supabase Realtime publication.

### RLS

- Users can SELECT and UPDATE (mark as read) only their own rows
- INSERT via service role only (bypasses RLS)

### Realtime

- `NotificationBell` component uses a dedicated Realtime subscription (not the generic `useRealtime` hook) with a row-level filter: `filter: 'user_id=eq.<userId>'` to ensure users only receive their own notifications
- Subscribes to INSERT events on the `notifications` table
- Initial load: fetch last 20 notifications via query
- New notifications: appear instantly via Realtime, increment unread badge

### Components

- `NotificationBell`: lives in admin topbar, shows unread count badge, dropdown with recent notifications, "mark all read" action
- `NotificationList`: full page at `/admin/notifications` for browsing history
- Clicking a notification: marks as read + navigates to `link` if present

### Creating notifications

```ts
// features/notifications/actions/create-notification.ts
"use server"
export async function createNotification(params: {
  userId: string;
  title: string;
  message?: string;
  link?: string;
}): Promise<void>
```

Called from other server actions — e.g. admin invites a user → notification for admin confirming it.

---

## 4. Permission Engine Upgrade

### Current state

`can(role, permission)` exists in `lib/acl.ts` but only `RoleGuard` uses it client-side. Middleware checks auth but not permissions. Server actions have no permission checks.

### Three-layer security model

1. **Middleware** (route level): blocks page access
2. **Server actions** (operation level): blocks mutations
3. **RLS** (row level): blocks data access

Each layer is independent — if one fails, the others still protect.

### Route-to-permission mapping in middleware

```ts
// Ordered longest-prefix-first. Middleware uses startsWith matching,
// so '/admin/contacts' covers '/admin/contacts/abc/edit' etc.
const routePermissions: [string, Permission][] = [
  ['/admin/notifications', 'notifications.read'],
  ['/admin/contacts', 'contacts.read'],
  ['/admin/settings', 'settings.read'],
  ['/admin/users', 'users.read'],
  ['/admin/audit', 'audit.read'],
  ['/admin/files', 'files.read'],
];
```

Middleware iterates the list and finds the first entry where `pathname.startsWith(route)`. Resolves the user's role, checks `can(role, permission)`, redirects to `/admin` if denied.

### Server action guard

```ts
// lib/acl.ts
export async function requirePermission(permission: Permission): Promise<{ userId: string; role: Role }>
```

Reads session, gets role, checks permission. Throws if denied. Returns user context for use in the action.

Called at the top of every server action:

```ts
const { userId } = await requirePermission('contacts.write');
```

### New permissions

Add to `types/acl.ts`:
- `audit.read`
- `notifications.read`

Fix existing orphaned permissions: `contacts.delete` and `files.delete` exist in the Permission type but are never assigned to any role. Assign them to `editor` role (admins already get them via `'all'`).

Update role matrix in `lib/acl.ts`:
- `admin`: `'all'` (unchanged — covers everything including new permissions)
- `editor`: add `contacts.delete`, `files.delete`, `audit.read`, `notifications.read`
- `viewer`: add `notifications.read`

### RoleGuard

No changes — it already uses `can()`. It continues to hide UI elements client-side.

---

## 5. Dark Mode

### Implementation

1. Wrap root layout children in `ThemeProvider` from `next-themes` (already installed)
2. Add `suppressHydrationWarning` to `<html>` tag
3. Add theme toggle button (sun/moon icon) in admin topbar
4. Default theme: `system` (respects OS preference)

shadcn/ui and Tailwind v4 already support dark mode — no component changes needed.

---

## 6. Error Boundaries + Env Validation

### Error boundaries

- `components/admin/error-boundary.tsx`: React error boundary with retry button and friendly message
- `app/admin/error.tsx`: Next.js error file for the admin route segment — catches server component errors
- Admin layout wraps `{children}` in the error boundary

### Env validation

- `lib/env.ts`: Zod schema validating only Next.js process env vars (not Docker Compose vars — those are validated by their respective services)
- Split into `serverSchema` (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) and `clientSchema` (NEXT_PUBLIC_*)
- Imported by `lib/supabase/client.ts` and `lib/supabase/server.ts`
- Fails on first import with a clear error listing all missing vars

Required vars validated:

```
# Client (available in browser)
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY

# Server only
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
```

---

## 7. Feature Generator Script

### Usage

```bash
npx tsx scripts/generate-entity.ts products
```

### Generated files

```
src/features/products/
├── queries/
│   ├── get-products.ts
│   └── get-product.ts
├── actions/
│   ├── create-product.ts
│   ├── update-product.ts
│   └── delete-product.ts
├── components/
│   ├── product-columns.tsx
│   └── product-form.tsx
└── types.ts

src/app/admin/products/
├── page.tsx
├── new/page.tsx
├── [id]/page.tsx
└── [id]/edit/page.tsx

supabase/migrations/NNNNN_products.sql  (template)
```

### Post-generation instructions

Script prints what to do manually:
1. Edit the migration SQL (add columns)
2. Add RLS policies
3. Add permissions to `types/acl.ts` and `lib/acl.ts`
4. Add sidebar entry in `components/layout/admin-sidebar.tsx`
5. Run `supabase db reset` or apply migration

---

## 8. Nice-to-Haves Documentation

Written to `docs/NICE-TO-HAVES.md`. Covers per-project additions that are not in the template:

- Event bus / dispatcher
- Feature flags
- Stripe / billing integration
- Sentry / error tracking
- PostHog / analytics
- Activity feed UI
- E2E tests (Playwright)
- Multi-tenant (organizations)
- Rate limiting
- CAPTCHA on auth forms
- Email verification flow

Each section includes: what it is, when you need it, implementation approach, and example code.

---

## Out of scope

- Multi-tenant / organizations (per-project)
- Stripe / billing (per-project)
- CI/CD pipeline (per-project)
- E2E test suite (documented in nice-to-haves)
- next/image optimization (unrelated to this upgrade)
