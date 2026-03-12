# Template Upgrade Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure the PHPro Vibe Starter to feature-based architecture and add audit logging, notifications (realtime), permission engine, dark mode, error boundaries, env validation, and a feature generator script.

**Architecture:** Move domain logic from flat `lib/` structure into `features/` folders (queries/actions/components/types per feature). Keep `lib/` for shared infrastructure, `components/` for reusable UI. New features (audit, notifications) are built directly in the new structure.

**Tech Stack:** Next.js 16, React 19, Supabase (self-hosted), shadcn/ui, Tailwind v4, Zod, next-themes

**Spec:** `docs/superpowers/specs/2026-03-12-template-upgrade-design.md`

**Note:** This project has no test framework. Verification is done via `npm run build` (type checks + compilation) and manual dev server checks.

---

## Chunk 1: Infrastructure Foundation

### Task 1: Database Migrations (audit_logs + notifications)

**Files:**
- Create: `supabase/migrations/00006_audit_logs.sql`
- Create: `supabase/migrations/00007_notifications.sql`

- [ ] **Step 1: Create audit_logs migration**

Create `supabase/migrations/00006_audit_logs.sql`:

```sql
-- Audit log: append-only table tracking all admin actions
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

- [ ] **Step 2: Create notifications migration**

Create `supabase/migrations/00007_notifications.sql`:

```sql
-- In-app notifications with realtime support
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

CREATE POLICY "notifications_select" ON notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "notifications_update" ON notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- No INSERT policy — inserts via service role (bypasses RLS)

CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read, created_at DESC);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
```

- [ ] **Step 3: Update generated database types**

Update `src/types/database.ts` to include `audit_logs` and `notifications` table types. Add the table definitions to the existing `Database['public']['Tables']` type, following the exact pattern used for `contacts` and `user_profiles`.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/00006_audit_logs.sql supabase/migrations/00007_notifications.sql src/types/database.ts
git commit -m "feat: add audit_logs and notifications tables"
```

---

### Task 2: Env Validation

**Files:**
- Create: `src/lib/env.ts`
- Modify: `src/lib/supabase/client.ts` (add env import)
- Modify: `src/lib/supabase/server.ts` (add env import)
- Modify: `src/lib/supabase/admin.ts` (add env import)

- [ ] **Step 1: Create env validation module**

Create `src/lib/env.ts`:

```ts
import { z } from 'zod';

const clientSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().min(1),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

const serverSchema = z.object({
  SUPABASE_URL: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
});

function validateEnv<T extends z.ZodType>(schema: T, env: Record<string, unknown>, label: string): z.infer<T> {
  const result = schema.safeParse(env);
  if (!result.success) {
    const missing = result.error.issues.map((i) => i.path.join('.')).join(', ');
    throw new Error(`❌ Missing or invalid ${label} env vars: ${missing}\nCheck your .env file.`);
  }
  return result.data;
}

// Lazy validation: validate on first access, not at module top level.
// This prevents build failures during `next build` SSR prerendering
// when env vars may not be set.
let _clientEnv: z.infer<typeof clientSchema> | null = null;
export function getClientEnv() {
  if (!_clientEnv) {
    _clientEnv = validateEnv(clientSchema, {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    }, 'client');
  }
  return _clientEnv;
}

let _serverEnv: z.infer<typeof serverSchema> | null = null;
export function getServerEnv() {
  if (!_serverEnv) {
    _serverEnv = validateEnv(serverSchema, {
      SUPABASE_URL: process.env.SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    }, 'server');
  }
  return _serverEnv;
}
```

**Important:** Uses `from 'zod'` (not `from 'zod/v4'`) to match the existing codebase convention. Env validation is lazy (via getter functions) to avoid breaking `next build` when env vars are absent during SSR prerendering.

- [ ] **Step 2: Wire env into Supabase clients**

In `src/lib/supabase/client.ts`, replace the `process.env` usages with lazy env:

```ts
import { getClientEnv } from '@/lib/env';
// Inside the function body (not at module level):
const env = getClientEnv();
createBrowserClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
```

In `src/lib/supabase/server.ts`:

```ts
import { getServerEnv, getClientEnv } from '@/lib/env';
// Inside the function body:
const env = getServerEnv();
const clientEnv = getClientEnv();
createServerClient<Database>(env.SUPABASE_URL, clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY, ...);
```

In `src/lib/supabase/admin.ts`:

```ts
import { getServerEnv } from '@/lib/env';
// Inside the function body:
const env = getServerEnv();
createClient<Database>(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
```

**Important:** Call `getClientEnv()`/`getServerEnv()` inside function bodies, not at module top level. This ensures validation only runs when the client is actually created, not during build-time module evaluation.

**Note:** `src/middleware.ts` creates its own Supabase client inline with `process.env` — leave that as-is since middleware runs in edge runtime and cannot import the env module safely.

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: Builds successfully with no type errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/env.ts src/lib/supabase/client.ts src/lib/supabase/server.ts src/lib/supabase/admin.ts
git commit -m "feat: add env validation with Zod"
```

---

### Task 3: Dark Mode

**Files:**
- Modify: `src/app/layout.tsx` (add ThemeProvider)
- Create: `src/components/layout/theme-toggle.tsx`
- Modify: `src/components/layout/admin-topbar.tsx` (add toggle)

- [ ] **Step 1: Add ThemeProvider to root layout**

Modify `src/app/layout.tsx`:

```tsx
import { ThemeProvider } from 'next-themes';

// In the return:
<html lang="en" suppressHydrationWarning className={cn('font-sans', geist.variable)}>
  <body>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      {children}
      <Toaster />
    </ThemeProvider>
  </body>
</html>
```

- [ ] **Step 2: Create theme toggle component**

Create `src/components/layout/theme-toggle.tsx`:

```tsx
'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Moon, Sun } from 'lucide-react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return <Button variant="ghost" size="sm" className="h-8 w-8" disabled />;

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-8 w-8"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
    >
      {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}
```

- [ ] **Step 3: Add theme toggle to admin topbar**

Modify `src/components/layout/admin-topbar.tsx` — add `<ThemeToggle />` before the user avatar dropdown, in the `<div className="flex-1" />` gap area:

```tsx
import { ThemeToggle } from '@/components/layout/theme-toggle';

// In the return, replace `<div className="flex-1" />` with:
<div className="flex-1" />
<ThemeToggle />
```

- [ ] **Step 4: Verify**

Run: `npm run build`
Expected: Builds successfully.

- [ ] **Step 5: Commit**

```bash
git add src/app/layout.tsx src/components/layout/theme-toggle.tsx src/components/layout/admin-topbar.tsx
git commit -m "feat: add dark mode with system preference detection"
```

---

### Task 4: Error Boundaries

**Files:**
- Create: `src/components/admin/error-boundary.tsx`
- Create: `src/app/admin/error.tsx`
- Modify: `src/app/admin/layout.tsx` (wrap children)

- [ ] **Step 1: Create React error boundary component**

Create `src/components/admin/error-boundary.tsx`:

```tsx
'use client';

import { Component, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

type Props = { children: ReactNode };
type State = { hasError: boolean; error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center p-12">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Something went wrong
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                An unexpected error occurred. Try refreshing the page.
              </p>
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <pre className="mt-4 max-h-40 overflow-auto rounded bg-muted p-3 text-xs">
                  {this.state.error.message}
                </pre>
              )}
            </CardContent>
            <CardFooter>
              <Button onClick={() => this.setState({ hasError: false, error: null })}>
                Try again
              </Button>
            </CardFooter>
          </Card>
        </div>
      );
    }
    return this.props.children;
  }
}
```

- [ ] **Step 2: Create Next.js error page for admin segment**

Create `src/app/admin/error.tsx`:

```tsx
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex items-center justify-center p-12">
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Something went wrong
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            An unexpected error occurred loading this page.
          </p>
          {process.env.NODE_ENV === 'development' && (
            <pre className="mt-4 max-h-40 overflow-auto rounded bg-muted p-3 text-xs">
              {error.message}
            </pre>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={reset}>Try again</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
```

- [ ] **Step 3: Wrap admin layout children in ErrorBoundary**

Modify `src/app/admin/layout.tsx`:

```tsx
import { ErrorBoundary } from '@/components/admin/error-boundary';

// Wrap {children} in the main tag:
<main className="flex-1 p-6">
  <ErrorBoundary>{children}</ErrorBoundary>
</main>
```

- [ ] **Step 4: Verify build**

Run: `npm run build`

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/error-boundary.tsx src/app/admin/error.tsx src/app/admin/layout.tsx
git commit -m "feat: add error boundaries for admin panel"
```

---

### Task 5: Permission Engine Upgrade

**Files:**
- Modify: `src/types/acl.ts` (add new permissions)
- Modify: `src/lib/acl.ts` (fix role matrix — keep edge-safe, no Supabase imports)
- Create: `src/lib/require-permission.ts` (server-only permission guard)
- Modify: `src/middleware.ts` (add permission checking)

- [ ] **Step 1: Update permission types**

Modify `src/types/acl.ts` — add `audit.read` and `notifications.read` to the Permission union:

```ts
export type Permission =
  | 'dashboard.read'
  | 'contacts.read'
  | 'contacts.write'
  | 'contacts.delete'
  | 'files.read'
  | 'files.write'
  | 'files.delete'
  | 'users.read'
  | 'users.write'
  | 'settings.read'
  | 'settings.write'
  | 'audit.read'
  | 'notifications.read'
  | 'demo.read';
```

- [ ] **Step 2: Fix role matrix in acl.ts (keep edge-safe)**

Modify `src/lib/acl.ts` — this file must stay edge-safe (no Supabase imports) since middleware imports `can()`:

```ts
import type { Role, Permission } from '@/types/acl';

export { roles } from '@/types/acl';
export type { Role, Permission } from '@/types/acl';

const rolePermissions: Record<Role, Permission[] | 'all'> = {
  admin: 'all',
  editor: [
    'dashboard.read',
    'contacts.read',
    'contacts.write',
    'contacts.delete',
    'files.read',
    'files.write',
    'files.delete',
    'users.read',
    'settings.read',
    'audit.read',
    'notifications.read',
    'demo.read',
  ],
  viewer: [
    'dashboard.read',
    'contacts.read',
    'files.read',
    'notifications.read',
    'demo.read',
  ],
};

export function can(role: Role, permission: Permission): boolean {
  const perms = rolePermissions[role];
  if (perms === 'all') return true;
  return perms.includes(permission);
}
```

**Note:** Editor gets `users.read` and `settings.read` (intentional — these pages were previously accessible to all authenticated users, so we preserve access while adding the permission guard). `contacts.delete` and `files.delete` were orphaned permissions — now assigned to editor.

- [ ] **Step 2b: Create requirePermission in a separate server-only file**

Create `src/lib/require-permission.ts` — this file imports Supabase and is NOT edge-safe (only for server actions):

```ts
import type { Role, Permission } from '@/types/acl';
import { can } from '@/lib/acl';
import { createServerClient } from '@/lib/supabase/server';

/**
 * Server action guard. Call at the top of any "use server" function.
 * Reads the current user session and checks the permission.
 * Throws if denied. Returns user context for use in the action.
 */
export async function requirePermission(
  permission: Permission,
): Promise<{ userId: string; role: Role }> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized: not authenticated');
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const role = profile?.role as Role | undefined;
  if (!role) {
    throw new Error('Unauthorized: no role assigned');
  }

  if (!can(role, permission)) {
    throw new Error(`Forbidden: missing permission '${permission}'`);
  }

  return { userId: user.id, role };
}
```

**Critical:** `can()` stays in `lib/acl.ts` (edge-safe, imported by middleware). `requirePermission()` lives in `lib/require-permission.ts` (server-only, imports Supabase). This split prevents middleware from crashing — edge runtime cannot import `cookies()` from `next/headers`.

**Important:** Check if `createServerClient()` in `src/lib/supabase/server.ts` is async (uses `await cookies()`). If so, the call above needs `await`. If it returns synchronously, remove the `await`. Match the existing usage.

- [ ] **Step 3: Add permission checking to middleware**

Modify `src/middleware.ts`. After the existing auth check (`if (isAdminRoute && !user)`), replace the role-fetch block with permission-based checking:

```ts
import { can } from '@/lib/acl';
import type { Permission, Role } from '@/types/acl';

// Route-to-permission mapping (prefix match via startsWith).
// /admin and /admin/demo are accessible to all authenticated users.
const routePermissions: [string, Permission][] = [
  ['/admin/notifications', 'notifications.read'],
  ['/admin/contacts', 'contacts.read'],
  ['/admin/settings', 'settings.read'],
  ['/admin/users', 'users.read'],
  ['/admin/audit', 'audit.read'],
  ['/admin/files', 'files.read'],
  ['/admin/demo', 'demo.read'],
];

// Inside the middleware function, replace the existing role check block:
if (isAdminRoute && user) {
  const { data } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  const role = data?.role as Role | undefined;

  if (!role) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Check route-level permissions
  const match = routePermissions.find(([prefix]) =>
    request.nextUrl.pathname.startsWith(prefix),
  );
  if (match && !can(role, match[1])) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }
}
```

**Note:** The `can` function and types must be importable in edge runtime. They are pure functions with no Node.js dependencies, so this is safe. However, `requirePermission` (which uses Supabase) should NOT be imported in middleware — it's for server actions only.

- [ ] **Step 4: Verify build**

Run: `npm run build`

- [ ] **Step 5: Commit**

```bash
git add src/types/acl.ts src/lib/acl.ts src/lib/require-permission.ts src/middleware.ts
git commit -m "feat: upgrade permission engine with middleware + server action guards"
```

---

## Chunk 2: Feature Folder Restructure

### Task 6: Create Feature Structure for Auth

**Files:**
- Create: `src/features/auth/queries/get-current-user.ts`
- Create: `src/features/auth/queries/get-user-role.ts`
- Create: `src/features/auth/actions/login.ts`
- Create: `src/features/auth/actions/register.ts`
- Create: `src/features/auth/actions/forgot-password.ts`
- Create: `src/features/auth/actions/reset-password.ts`
- Create: `src/features/auth/components/login-form.tsx`
- Create: `src/features/auth/components/register-form.tsx`
- Create: `src/features/auth/components/forgot-password-form.tsx`
- Create: `src/features/auth/components/reset-password-form.tsx`
- Create: `src/features/auth/types.ts`
- Modify: `src/lib/supabase/queries.ts` → to be deleted after migration
- Modify: `src/app/(auth)/login/page.tsx` → thin wrapper
- Modify: `src/app/(auth)/register/page.tsx` → thin wrapper
- Modify: `src/app/(auth)/forgot-password/page.tsx` → thin wrapper
- Modify: `src/app/(auth)/reset-password/page.tsx` → thin wrapper

- [ ] **Step 1: Create auth queries**

Create `src/features/auth/queries/get-current-user.ts`:
Move `getUser()` and `getUserProfile()` from `src/lib/supabase/queries.ts`. Keep the `React.cache()` wrapper. Import `createServerClient` from `@/lib/supabase/server`.

Create `src/features/auth/queries/get-user-role.ts`:
Move `getUserRole()` from `src/lib/supabase/queries.ts`. Keep the `React.cache()` wrapper.

- [ ] **Step 2: Auth actions folder (server-only operations)**

Auth form submission (login, register, forgot-password, reset-password) must stay in client components because Supabase auth requires the browser client for cookie-based token flow. Do NOT create `"use server"` actions for these.

The `features/auth/actions/` folder is reserved for server-only auth operations. For now, move the existing invite logic from `src/app/api/admin/invite/route.ts` conceptually into this space (or leave the API route as-is since it's a webhook-style endpoint). No auth server actions needed at this stage.

- [ ] **Step 3: Create auth form components**

Extract the form UI from each auth page into components:

Create `src/features/auth/components/login-form.tsx`:
Move the form JSX + state + handleSubmit from `src/app/(auth)/login/page.tsx`. The component handles its own Supabase auth calls (client-side).

Create `src/features/auth/components/register-form.tsx`:
Same extraction from `src/app/(auth)/register/page.tsx`.

Create `src/features/auth/components/forgot-password-form.tsx`:
Same extraction from `src/app/(auth)/forgot-password/page.tsx`.

Create `src/features/auth/components/reset-password-form.tsx`:
Same extraction from `src/app/(auth)/reset-password/page.tsx`.

- [ ] **Step 4: Create auth types**

Create `src/features/auth/types.ts`:
```ts
export type { UserWithRole } from '@/types/acl';
```

Re-export the auth-related types for feature-local imports.

- [ ] **Step 5: Make auth pages thin wrappers**

Update each auth page to just import and render the form component:

`src/app/(auth)/login/page.tsx`:
```tsx
import { LoginForm } from '@/features/auth/components/login-form';
export default function LoginPage() {
  return <LoginForm />;
}
```

Same pattern for register, forgot-password, reset-password.

- [ ] **Step 6: Delete old queries.ts**

Delete `src/lib/supabase/queries.ts`. Note: this file is currently not imported by any source file (the functions exist but are unused). Delete it directly. Future code will import from `@/features/auth/queries/` instead.

- [ ] **Step 7: Verify build**

Run: `npm run build`

- [ ] **Step 8: Commit**

```bash
git add src/features/auth/ src/app/\(auth\)/ src/lib/supabase/
git commit -m "feat: restructure auth into feature folder"
```

---

### Task 7: Create Feature Structure for Contacts

**Files:**
- Create: `src/features/contacts/queries/get-contacts.ts`
- Create: `src/features/contacts/queries/get-contact.ts`
- Create: `src/features/contacts/actions/create-contact.ts`
- Create: `src/features/contacts/actions/update-contact.ts`
- Create: `src/features/contacts/actions/delete-contact.ts`
- Create: `src/features/contacts/components/contact-columns.tsx`
- Create: `src/features/contacts/components/contact-form.tsx`
- Create: `src/features/contacts/types.ts`
- Modify: `src/app/admin/contacts/page.tsx` → thin wrapper
- Modify: `src/app/admin/contacts/new/page.tsx` → thin wrapper
- Modify: `src/app/admin/contacts/[id]/page.tsx` → thin wrapper
- Modify: `src/app/admin/contacts/[id]/edit/page.tsx` → thin wrapper

- [ ] **Step 1: Create contact types + Zod schemas**

Create `src/features/contacts/types.ts`:
```ts
import type { Database } from '@/types/database';
import { z } from 'zod/v4';

export type Contact = Database['public']['Tables']['contacts']['Row'];
export type ContactInsert = Database['public']['Tables']['contacts']['Insert'];

export const contactSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.email().optional().or(z.literal('')),
  phone: z.string().optional(),
  company: z.string().optional(),
  notes: z.string().optional(),
});

export type ContactFormValues = z.infer<typeof contactSchema>;
```

Match the exact field names from the `contacts` table in `supabase/migrations/00002_contacts_example.sql`.

- [ ] **Step 2: Create contact server actions**

Create `src/features/contacts/actions/create-contact.ts`:
```ts
'use server';
import { requirePermission } from '@/lib/require-permission';
import { createServerClient } from '@/lib/supabase/server';
import { contactSchema } from '../types';

export async function createContact(values: unknown) {
  const { userId } = await requirePermission('contacts.write');
  const parsed = contactSchema.parse(values);
  const supabase = await createServerClient();
  const { error } = await supabase.from('contacts').insert({ ...parsed, created_by: userId });
  if (error) throw new Error(error.message);
}
```

Create `src/features/contacts/actions/update-contact.ts`:
Same pattern with `requirePermission('contacts.write')`, takes `id` + `values`.

Create `src/features/contacts/actions/delete-contact.ts`:
Uses `requirePermission('contacts.delete')`. Takes `id`.

All three actions should also call `logAction()` from `features/audit/actions/log-action.ts` — but that doesn't exist yet. Add a `// TODO: logAction()` comment for now. It will be wired in Task 10.

- [ ] **Step 3: Create contact queries**

Create `src/features/contacts/queries/get-contacts.ts`:
Server-side query wrapped in `React.cache()`. Accepts pagination params (page, pageSize, search, sort). Returns `{ data: Contact[], count: number }`.

Create `src/features/contacts/queries/get-contact.ts`:
Server-side query. Takes `id`, returns single `Contact | null`.

- [ ] **Step 4: Extract contact UI components**

Create `src/features/contacts/components/contact-columns.tsx`:
Extract the column definitions from `src/app/admin/contacts/page.tsx` into a standalone file that exports `getContactColumns(router, handleDelete)`. This keeps the column config with the domain.

Create `src/features/contacts/components/contact-form.tsx`:
Extract the form fields + Zod schema from `new/page.tsx` and `[id]/edit/page.tsx` into a reusable `ContactForm` component that works for both create and edit (takes optional `defaultValues` prop).

- [ ] **Step 5: Make contact pages thin wrappers**

Simplify each page to import from `features/contacts/`:

`src/app/admin/contacts/page.tsx` — stays as a client component. Imports `getContactColumns` from `features/contacts/components/contact-columns`. Still uses `useEntity` hook from `lib/hooks/` for list fetching (client-side pagination/search). The server query `get-contacts.ts` exists for use in server components that need contact data (e.g., dashboard stats), but the list page uses the client hook for interactive pagination.

`src/app/admin/contacts/new/page.tsx` — imports `ContactForm`, calls `createContact` server action on submit.
`src/app/admin/contacts/[id]/page.tsx` — imports `getContact` query for server-side fetch.
`src/app/admin/contacts/[id]/edit/page.tsx` — imports `ContactForm` with `defaultValues`, calls `updateContact` server action on submit.

Pages should be noticeably shorter than current — most logic lives in `features/contacts/`.

- [ ] **Step 6: Verify build**

Run: `npm run build`

- [ ] **Step 7: Commit**

```bash
git add src/features/contacts/ src/app/admin/contacts/
git commit -m "feat: restructure contacts into feature folder"
```

---

### Task 8: Create Feature Structure for Users + Files + Settings

**Files:**
- Create: `src/features/users/queries/get-users.ts`
- Create: `src/features/users/queries/get-user.ts`
- Create: `src/features/users/actions/update-user-role.ts`
- Create: `src/features/users/components/` (as needed)
- Create: `src/features/users/types.ts`
- Create: `src/features/files/queries/get-files.ts`
- Create: `src/features/files/actions/upload-file.ts`
- Create: `src/features/files/actions/delete-file.ts`
- Create: `src/features/files/components/` (as needed)
- Create: `src/features/files/types.ts`
- Modify: `src/app/admin/users/page.tsx` → thin wrapper
- Modify: `src/app/admin/users/[id]/page.tsx` → thin wrapper
- Modify: `src/app/admin/files/page.tsx` → thin wrapper
- Modify: `src/app/admin/settings/page.tsx` → thin wrapper

- [ ] **Step 1: Create users feature**

Follow the exact same pattern as contacts (Task 7):
- `types.ts` — re-export `UserWithRole` type
- `queries/get-users.ts` — server query, paginated list from `user_profiles`
- `queries/get-user.ts` — server query, single user by id
- `actions/update-user-role.ts` — server action with `requirePermission('users.write')`, uses service role client for role changes
- Simplify `src/app/admin/users/page.tsx` and `[id]/page.tsx` to import from features

**Note:** The user detail page (`users/[id]/page.tsx`) needs both the server action (`update-user-role`) and the client-side `useAuth` hook (to show/hide the role dropdown based on current user's role). Keep imports from `@/lib/hooks/use-auth` and `roles`/`can` from `@/lib/acl` — these are infrastructure, not domain logic, so importing them in the page is correct per the architectural rules.

- [ ] **Step 2: Create files feature**

- `types.ts` — file metadata type (from Supabase Storage)
- `queries/get-files.ts` — list files from storage bucket
- `actions/upload-file.ts` — server action or keep client-side (Storage uploads need browser client for signed URLs). If client-side, put the logic in `components/` instead of `actions/`.
- `actions/delete-file.ts` — server action with `requirePermission('files.delete')`
- Simplify `src/app/admin/files/page.tsx`

**Note:** File uploads in Supabase typically happen client-side (direct upload to Storage). The `use-file-upload.ts` hook in `lib/hooks/` stays there as it's generic infrastructure. Feature-specific file components go in `features/files/components/`.

- [ ] **Step 3: Handle settings page**

Settings doesn't need its own feature folder — it's a single page with key-value CRUD on `app_settings`. Keep it as a page with inline logic. (92 lines — not complex enough to warrant a feature folder.)

- [ ] **Step 3b: Update demo pages**

The demo pages (`/admin/demo/roles`, `/admin/demo/realtime`, `/admin/demo/components`) stay as-is (they're showcases, not domain features). But update:

- `src/app/admin/demo/roles/page.tsx`: Update the hardcoded `allPermissions` array to include `audit.read` and `notifications.read`.
- Verify all demo page imports (`@/lib/hooks/use-auth`, `@/lib/acl`, `@/lib/hooks/use-realtime`) still resolve correctly after the restructure. These are all `lib/` imports which don't move, so they should be fine.

- [ ] **Step 3c: Fix broken invite link in users page**

`src/app/admin/users/page.tsx` links to `/admin/users/invite` which doesn't exist. Either:
- Create a simple invite page at `src/app/admin/users/invite/page.tsx` that renders an invite form calling the existing `/api/admin/invite` API route, OR
- Change the button to open an inline dialog/modal on the users list page.

Choose the simpler approach based on the existing UI pattern.

- [ ] **Step 4: Verify build**

Run: `npm run build`

- [ ] **Step 5: Commit**

```bash
git add src/features/users/ src/features/files/ src/app/admin/users/ src/app/admin/files/
git commit -m "feat: restructure users and files into feature folders"
```

---

## Chunk 3: New Features

### Task 9: Audit Logging Feature

**Files:**
- Create: `src/features/audit/types.ts`
- Create: `src/features/audit/actions/log-action.ts`
- Create: `src/features/audit/queries/get-audit-logs.ts`
- Create: `src/features/audit/components/audit-log-table.tsx`
- Create: `src/features/audit/components/audit-filters.tsx`
- Create: `src/features/audit/components/audit-detail.tsx`
- Create: `src/app/admin/audit/page.tsx`
- Modify: `src/components/layout/admin-sidebar.tsx` (add Audit nav item)

- [ ] **Step 1: Create audit types**

Create `src/features/audit/types.ts`:
```ts
import type { Database } from '@/types/database';

export type AuditLog = Database['public']['Tables']['audit_logs']['Row'];

export type AuditLogFilters = {
  action?: string;
  entityType?: string;
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
};
```

- [ ] **Step 2: Create logAction server helper**

Create `src/features/audit/actions/log-action.ts`:
```ts
'use server';

import { headers } from 'next/headers';
import { createServerClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/admin';

export async function logAction(params: {
  action: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  // Get user from session (anon client reads cookies)
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Get IP from headers
  const headersList = await headers();
  const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;

  // Insert via service role (bypasses RLS)
  const admin = createServiceRoleClient();
  await admin.from('audit_logs').insert({
    user_id: user?.id ?? null,
    action: params.action,
    entity_type: params.entityType ?? null,
    entity_id: params.entityId ?? null,
    metadata: params.metadata ?? {},
    ip_address: ip,
  });
}
```

- [ ] **Step 3: Create audit log query**

Create `src/features/audit/queries/get-audit-logs.ts`:

Server query that accepts `AuditLogFilters` + pagination params. Queries `audit_logs` table with optional filters (`.eq()` for action/entityType/userId, `.gte()`/`.lte()` for date range). Joins `user_profiles` to get the user's name/email for display. Returns `{ data: AuditLog[], count: number }`.

- [ ] **Step 4: Create audit UI components**

Create `src/features/audit/components/audit-filters.tsx`:
Filter bar with select dropdowns for action type, entity type, and a date range picker. Calls back `onFilterChange(filters)`.

Create `src/features/audit/components/audit-log-table.tsx`:
Wraps the shared `DataTable` component with audit-specific columns: timestamp, user (name + email), action, entity type, entity ID. Each row is clickable to show detail.

Create `src/features/audit/components/audit-detail.tsx`:
A dialog/sheet that shows the full `metadata` JSON. If metadata has `old` and `new` keys, render as a diff (highlight changed fields). Otherwise show raw JSON.

- [ ] **Step 5: Create audit page**

Create `src/app/admin/audit/page.tsx`:
Thin wrapper that composes `AuditFilters` + `AuditLogTable`. Uses client-side state for filters, fetches via `useEntity` or a custom hook that calls the audit query.

Since audit logs are read-only from the admin panel, this page only needs list + detail views (no create/edit).

- [ ] **Step 6: Add Audit to sidebar**

Modify `src/components/layout/admin-sidebar.tsx`:
Add to the Main nav section, after Settings:
```ts
{ label: 'Audit Log', href: '/admin/audit', icon: ScrollText },
```
Import `ScrollText` from `lucide-react`.

- [ ] **Step 7: Verify build**

Run: `npm run build`

- [ ] **Step 8: Commit**

```bash
git add src/features/audit/ src/app/admin/audit/ src/components/layout/admin-sidebar.tsx
git commit -m "feat: add audit logging with admin UI"
```

---

### Task 10: Wire Audit Logging into Existing Actions

**Files:**
- Modify: `src/features/contacts/actions/create-contact.ts`
- Modify: `src/features/contacts/actions/update-contact.ts`
- Modify: `src/features/contacts/actions/delete-contact.ts`
- Modify: `src/features/users/actions/update-user-role.ts`
- Modify: `src/features/files/actions/delete-file.ts`
- Modify: `src/app/api/admin/invite/route.ts`

- [ ] **Step 1: Add logAction calls to all mutations**

In each server action, after the successful Supabase mutation, call `logAction()`:

```ts
import { logAction } from '@/features/audit/actions/log-action';

// After successful insert/update/delete:
await logAction({
  action: 'contact.created',  // or .updated, .deleted
  entityType: 'contact',
  entityId: newRecord.id,
  metadata: { name: parsed.name },  // or { old: {...}, new: {...} } for updates
});
```

For updates, pass both old and new values in metadata so the audit detail view can show a diff.

For deletes, pass the entity data that was deleted (fetch before delete if needed, or pass from the caller).

For the invite API route, log `user.invited` with the invited email.

- [ ] **Step 2: Verify build**

Run: `npm run build`

- [ ] **Step 3: Commit**

```bash
git add src/features/contacts/actions/ src/features/users/actions/ src/features/files/actions/ src/app/api/admin/invite/route.ts
git commit -m "feat: wire audit logging into all mutations"
```

---

### Task 11: Notifications Feature

**Files:**
- Create: `src/features/notifications/types.ts`
- Create: `src/features/notifications/actions/create-notification.ts`
- Create: `src/features/notifications/actions/mark-as-read.ts`
- Create: `src/features/notifications/queries/get-notifications.ts`
- Create: `src/features/notifications/queries/get-unread-count.ts`
- Create: `src/features/notifications/components/notification-bell.tsx`
- Create: `src/features/notifications/components/notification-list.tsx`
- Create: `src/app/admin/notifications/page.tsx`
- Modify: `src/components/layout/admin-topbar.tsx` (add NotificationBell)
- Modify: `src/components/layout/admin-sidebar.tsx` (add nav item)

- [ ] **Step 1: Create notification types**

Create `src/features/notifications/types.ts`:
```ts
import type { Database } from '@/types/database';

export type Notification = Database['public']['Tables']['notifications']['Row'];
```

- [ ] **Step 2: Create notification server actions**

Create `src/features/notifications/actions/create-notification.ts`:
```ts
'use server';
import { createServiceRoleClient } from '@/lib/supabase/admin';

export async function createNotification(params: {
  userId: string;
  title: string;
  message?: string;
  link?: string;
}): Promise<void> {
  const admin = createServiceRoleClient();
  const { error } = await admin.from('notifications').insert({
    user_id: params.userId,
    title: params.title,
    message: params.message ?? null,
    link: params.link ?? null,
  });
  if (error) throw new Error(error.message);
}
```

Create `src/features/notifications/actions/mark-as-read.ts`:
```ts
'use server';
import { createServerClient } from '@/lib/supabase/server';

export async function markAsRead(notificationId: string): Promise<void> {
  const supabase = await createServerClient();
  await supabase.from('notifications').update({ is_read: true }).eq('id', notificationId);
}

export async function markAllAsRead(): Promise<void> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false);
}
```

- [ ] **Step 3: Create notification queries**

Create `src/features/notifications/queries/get-notifications.ts`:
Server query returning latest 20 notifications for the current user, ordered by `created_at DESC`.

Create `src/features/notifications/queries/get-unread-count.ts`:
Server query returning count of unread notifications for the current user.

- [ ] **Step 4: Create NotificationBell component**

Create `src/features/notifications/components/notification-bell.tsx`:

This is the most complex component. It needs:

1. **Initial load:** Fetch recent notifications + unread count on mount
2. **Realtime subscription:** Subscribe to `notifications` table INSERT events with filter `user_id=eq.<userId>`
3. **UI:** Bell icon with unread count badge, dropdown showing recent notifications
4. **Actions:** Click notification → mark as read + navigate to `link`. "Mark all read" button.

```tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/hooks/use-auth';
import { markAsRead, markAllAsRead } from '../actions/mark-as-read';
import type { Notification } from '../types';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';

export function NotificationBell() {
  const { user } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Initial fetch
  useEffect(() => {
    if (!user) return;
    const supabase = createBrowserClient();
    supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }) => {
        if (data) {
          setNotifications(data as Notification[]);
          setUnreadCount(data.filter((n) => !n.is_read).length);
        }
      });
  }, [user]);

  // Realtime subscription with user_id filter
  useEffect(() => {
    if (!user) return;
    const supabase = createBrowserClient();
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          setNotifications((prev) => [newNotification, ...prev].slice(0, 20));
          setUnreadCount((prev) => prev + 1);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleClick = useCallback(
    async (notification: Notification) => {
      if (!notification.is_read) {
        await markAsRead(notification.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n)),
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
      if (notification.link) {
        router.push(notification.link);
      }
    },
    [router],
  );

  const handleMarkAllRead = useCallback(async () => {
    await markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  }, []);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="sm" className="relative h-8 w-8">
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <Badge className="absolute -right-1 -top-1 h-4 w-4 rounded-full p-0 text-[10px]">
                {unreadCount}
              </Badge>
            )}
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          Notifications
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="h-auto p-0 text-xs" onClick={handleMarkAllRead}>
              Mark all read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">No notifications</div>
        ) : (
          notifications.slice(0, 5).map((n) => (
            <DropdownMenuItem key={n.id} onClick={() => handleClick(n)} className="flex flex-col items-start gap-1 p-3">
              <span className={n.is_read ? 'text-muted-foreground' : 'font-medium'}>{n.title}</span>
              {n.message && <span className="text-xs text-muted-foreground">{n.message}</span>}
              <span className="text-xs text-muted-foreground">
                {new Date(n.created_at).toLocaleDateString()}
              </span>
            </DropdownMenuItem>
          ))
        )}
        {notifications.length > 5 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/admin/notifications')} className="justify-center text-sm">
              View all notifications
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

**Important:** Verify that the `DropdownMenuTrigger` uses the `render` prop pattern matching the existing codebase (seen in `admin-topbar.tsx` and `contacts/page.tsx`). This is a base-ui pattern, not standard Radix.

- [ ] **Step 5: Create NotificationList page component**

Create `src/features/notifications/components/notification-list.tsx`:
Full-page list using DataTable or a simple list view showing all notifications with read/unread state, timestamps, and actions (mark read, navigate to link).

- [ ] **Step 6: Create notifications page**

Create `src/app/admin/notifications/page.tsx`:
Thin wrapper importing `NotificationList`.

- [ ] **Step 7: Add NotificationBell to admin topbar**

Modify `src/components/layout/admin-topbar.tsx`:
Import `NotificationBell` from `@/features/notifications/components/notification-bell`.
Place it between `<ThemeToggle />` and the user avatar dropdown.

- [ ] **Step 8: Add Notifications to sidebar**

Modify `src/components/layout/admin-sidebar.tsx`:
Add to Main nav section:
```ts
{ label: 'Notifications', href: '/admin/notifications', icon: Bell },
```
Import `Bell` from `lucide-react`.

- [ ] **Step 9: Verify build**

Run: `npm run build`

- [ ] **Step 10: Commit**

```bash
git add src/features/notifications/ src/app/admin/notifications/ src/components/layout/admin-topbar.tsx src/components/layout/admin-sidebar.tsx
git commit -m "feat: add notifications with realtime bell in topbar"
```

---

## Chunk 4: Tooling + Documentation

### Task 12: Feature Generator Script

**Files:**
- Create: `scripts/generate-entity.ts`

- [ ] **Step 1: Create the generator script**

Create `scripts/generate-entity.ts`:

The script:
1. Takes entity name as CLI arg (e.g., `products`)
2. Derives singular/plural forms
3. Creates the full feature folder structure under `src/features/<name>/`
4. Creates admin page files under `src/app/admin/<name>/`
5. Creates a migration template under `supabase/migrations/`
6. Prints post-generation instructions

Template files should follow the exact patterns from `features/contacts/`:
- `types.ts` — with placeholder Zod schema
- `queries/get-<plural>.ts` — server query with pagination
- `queries/get-<singular>.ts` — server query by ID
- `actions/create-<singular>.ts` — with `requirePermission` + `logAction`
- `actions/update-<singular>.ts` — with `requirePermission` + `logAction`
- `actions/delete-<singular>.ts` — with `requirePermission` + `logAction`
- `components/<singular>-columns.tsx` — DataTable column defs with placeholder columns
- `components/<singular>-form.tsx` — form component with placeholder fields
- `page.tsx` — list page
- `new/page.tsx` — create page
- `[id]/page.tsx` — detail page
- `[id]/edit/page.tsx` — edit page
- `NNNNN_<plural>.sql` — migration template with id, created_at, updated_at, created_by

The migration number should be auto-detected from existing migration files (find the highest number and increment).

Post-generation output:
```
✅ Generated feature: products

Files created:
  src/features/products/types.ts
  src/features/products/queries/get-products.ts
  src/features/products/queries/get-product.ts
  src/features/products/actions/create-product.ts
  src/features/products/actions/update-product.ts
  src/features/products/actions/delete-product.ts
  src/features/products/components/product-columns.tsx
  src/features/products/components/product-form.tsx
  src/app/admin/products/page.tsx
  src/app/admin/products/new/page.tsx
  src/app/admin/products/[id]/page.tsx
  src/app/admin/products/[id]/edit/page.tsx
  supabase/migrations/00008_products.sql

Next steps:
  1. Edit supabase/migrations/00008_products.sql — add your columns
  2. Add RLS policies to the migration
  3. Add 'products.read', 'products.write', 'products.delete' to src/types/acl.ts
  4. Add permissions to the role matrix in src/lib/acl.ts
  5. Add sidebar entry in src/components/layout/admin-sidebar.tsx
  6. Run: supabase db reset (or supabase migration up)
  7. Regenerate types: supabase gen types typescript --local > src/types/database.ts
```

- [ ] **Step 2: Add script to package.json**

Add to `package.json` scripts:
```json
"generate:entity": "tsx scripts/generate-entity.ts"
```

Also add `tsx` as a devDependency if not already installed:
```bash
npm install -D tsx
```

- [ ] **Step 3: Verify by running the generator**

Run: `npx tsx scripts/generate-entity.ts test-entity`
Expected: Files created, instructions printed.
Then: Delete the generated test files (`rm -rf src/features/test-entity src/app/admin/test-entity supabase/migrations/*test_entity*`)

- [ ] **Step 4: Commit**

```bash
git add scripts/generate-entity.ts package.json package-lock.json
git commit -m "feat: add entity generator script"
```

---

### Task 13: Nice-to-Haves Documentation

**Files:**
- Create: `docs/NICE-TO-HAVES.md`

- [ ] **Step 1: Write the nice-to-haves guide**

Create `docs/NICE-TO-HAVES.md` with sections for each per-project addition:

1. **Event Bus / Dispatcher** — when: complex cross-feature side effects. How: simple pub/sub with typed events. Example code.
2. **Feature Flags** — when: staged rollouts, beta features. How: `feature_flags` table + `isFeatureEnabled()` helper. Example migration + code.
3. **Stripe / Billing** — when: SaaS subscription billing. How: Stripe SDK + webhooks + `subscriptions` table. Example webhook handler.
4. **Sentry / Error Tracking** — when: production error monitoring. How: `@sentry/nextjs` setup. Example config.
5. **PostHog / Analytics** — when: user behavior tracking. How: PostHog SDK + `trackEvent()` wrapper. Example setup.
6. **Activity Feed UI** — when: user-facing timeline of actions. How: query `audit_logs` with a UI component. Example component.
7. **E2E Tests (Playwright)** — when: CI/CD regression testing. How: Playwright setup + example test for auth flow.
8. **Multi-Tenant (Organizations)** — when: team/company features needed. How: `organizations` + `organization_members` tables + RLS policies. Example migration.
9. **Rate Limiting** — when: public API routes, abuse prevention. How: Upstash Redis or in-memory rate limiter. Example middleware.
10. **CAPTCHA on Auth Forms** — when: bot spam on signup. How: Cloudflare Turnstile. Example integration.
11. **Email Verification** — when: confirmed email required before access. How: Supabase auth email confirmation flow. Configuration guide.

Each section: 3-4 sentences describing what/when, then a concrete code example showing how to add it to this template.

- [ ] **Step 2: Commit**

```bash
git add docs/NICE-TO-HAVES.md
git commit -m "docs: add nice-to-haves guide for per-project additions"
```

---

### Task 14: Final Cleanup

**Files:**
- Modify: `src/types/database.types.ts` (delete if unused)
- Verify: No broken imports across the codebase
- Verify: All `@/lib/supabase/queries` imports are updated

- [ ] **Step 1: Delete unused files**

Delete `src/types/database.types.ts` if it's empty/unused (the audit found it's a duplicate).

Delete `src/lib/supabase/queries.ts` if not already deleted in Task 6.

- [ ] **Step 2: Full build verification**

Run: `npm run build`
Expected: Clean build with no type errors.

Run: `npm run lint`
Expected: No lint errors (or only pre-existing ones).

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "chore: cleanup unused files after restructure"
```

---

## Task Dependency Graph

```
Task 1 (migrations)     ─┐
Task 2 (env validation)  ├─── Task 6 (auth feature) ─┐
Task 3 (dark mode)       │    Task 7 (contacts)       ├─ Task 9 (audit feature) ─── Task 10 (wire audit)
Task 4 (error boundaries)│    Task 8 (users/files)    │
Task 5 (permissions)    ─┘                            ├─ Task 11 (notifications)
                                                      │
                                                      ├─ Task 12 (generator)
                                                      ├─ Task 13 (docs)
                                                      └─ Task 14 (cleanup)
```

**Parallelizable:** Tasks 1-5 are independent. Tasks 6-8 are independent. Tasks 9, 11, 12, 13 are independent (after Tasks 6-8 complete).
