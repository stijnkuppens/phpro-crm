# Layer 1: Foundation — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Strip demo features, set up i18n, install new dependencies, update roles/ACL, restructure sidebar, create foundation tables (pipelines + stages), and build shared components needed by all subsequent layers.

**Architecture:** This layer touches infrastructure only — no business features yet. It prepares the codebase so Layers 2-6 can each add features independently following established patterns. All changes are additive except the contacts removal and demo page removal.

**Tech Stack:** next-intl, @dnd-kit/core, @dnd-kit/sortable, @platejs/core + plugins, Supabase migrations, shadcn/ui

**Spec:** `docs/superpowers/specs/2026-03-13-crm-port-design.md`

---

## Chunk 1: Cleanup & Dependencies

### Task 1: Remove old contacts feature and demo pages

**Files:**
- Delete: `src/features/contacts/` (entire directory)
- Delete: `src/app/admin/contacts/` (entire directory)
- Delete: `src/app/admin/demo/` (entire directory)
- Modify: `src/components/layout/admin-sidebar.tsx` (remove contacts and demo nav items)

- [ ] **Step 1: Delete the contacts feature directory**

```bash
rm -rf src/features/contacts/
```

- [ ] **Step 2: Delete the contacts route pages**

```bash
rm -rf src/app/admin/contacts/
```

- [ ] **Step 3: Delete the demo pages**

```bash
rm -rf src/app/admin/demo/
```

- [ ] **Step 4: Search for `demo.read` and `contacts.read` references**

Before removing these permissions, verify nothing else references them:

```bash
grep -r "demo\.read\|contacts\.read" src/ --include="*.ts" --include="*.tsx"
```

Expected results: `src/proxy.ts`, `src/types/acl.ts`, `src/lib/acl.ts`. If other files reference them, update those too.

- [ ] **Step 5: Remove contacts and demo entries from sidebar**

In `src/components/layout/admin-sidebar.tsx`, replace the entire `navSections` array with a temporary minimal version. This will be fully rewritten in Task 7, but we need it to compile now:

```ts
const navSections = [
  {
    section: 'Main',
    items: [
      { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
      { label: 'Users', href: '/admin/users', icon: Users },
      { label: 'Files', href: '/admin/files', icon: FileText },
      { label: 'Settings', href: '/admin/settings', icon: Settings },
      { label: 'Notifications', href: '/admin/notifications', icon: Bell },
      { label: 'Audit Log', href: '/admin/audit', icon: ScrollText },
    ],
  },
];
```

Remove unused imports: `Contact`, `Shield`, `Radio`, `LayoutGrid`.

- [ ] **Step 6: Verify the app compiles**

Run: `npx next build` or `npx next dev` and check no import errors. Note: `src/middleware.ts` is currently deleted — auth guard is absent until Task 4 restores it. This is expected.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: remove old contacts feature and demo pages"
```

---

### Task 2: Install new dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install next-intl**

```bash
npm install next-intl
```

- [ ] **Step 2: Install dnd-kit for kanban**

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

- [ ] **Step 3: Install Plate editor packages**

Use `context7` to verify the current Plate package names before running. As of writing, the packages use the `@udecode/plate` namespace:

```bash
npm install @udecode/plate
```

Note: Plate package names and structure change frequently. If the above fails, check https://platejs.org/docs/getting-started for the current install command. The project needs: core editor, basic marks (bold/italic), headings, lists, links, and paragraph support.

- [ ] **Step 4: Verify install succeeded**

```bash
npm ls next-intl @dnd-kit/core @udecode/plate
```

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install next-intl, dnd-kit, and plate editor"
```

---

### Task 3: Update roles and ACL permissions

**Files:**
- Modify: `src/types/acl.ts`
- Modify: `src/lib/acl.ts`

- [ ] **Step 1: Update roles and permissions in `src/types/acl.ts`**

Replace the entire file:

```ts
export const roles = ['admin', 'sales_manager', 'sales_rep', 'customer_success', 'marketing'] as const;
export type Role = (typeof roles)[number];

export type Permission =
  // Dashboard
  | 'dashboard.read'
  // Accounts
  | 'accounts.read'
  | 'accounts.write'
  | 'accounts.delete'
  // Contacts
  | 'contacts.read'
  | 'contacts.write'
  | 'contacts.delete'
  // Deals
  | 'deals.read'
  | 'deals.write'
  | 'deals.delete'
  // Activities
  | 'activities.read'
  | 'activities.write'
  // Tasks
  | 'tasks.read'
  | 'tasks.write'
  // Communications
  | 'communications.read'
  | 'communications.write'
  // Consultants
  | 'consultants.read'
  | 'consultants.write'
  // Bench
  | 'bench.read'
  | 'bench.write'
  // Contracts
  | 'contracts.read'
  | 'contracts.write'
  // Indexation
  | 'indexation.read'
  | 'indexation.write'
  | 'indexation.approve'
  // Revenue
  | 'revenue.read'
  | 'revenue.write'
  // Pipeline & Prognose
  | 'pipeline.read'
  | 'prognose.read'
  // HR
  | 'hr.read'
  | 'hr.write'
  // Equipment
  | 'equipment.read'
  | 'equipment.write'
  // Files (existing)
  | 'files.read'
  | 'files.write'
  | 'files.delete'
  // Users (existing)
  | 'users.read'
  | 'users.write'
  // Settings (existing)
  | 'settings.read'
  | 'settings.write'
  // Audit (existing)
  | 'audit.read'
  // Notifications (existing)
  | 'notifications.read';

export type UserWithRole = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: Role;
};
```

- [ ] **Step 2: Update role-permission mapping in `src/lib/acl.ts`**

Replace the entire file:

```ts
import type { Role, Permission } from '@/types/acl';

export { roles } from '@/types/acl';
export type { Role, Permission } from '@/types/acl';

const rolePermissions: Record<Role, Permission[] | 'all'> = {
  admin: 'all',

  sales_manager: [
    'dashboard.read',
    'accounts.read', 'accounts.write', 'accounts.delete',
    'contacts.read', 'contacts.write', 'contacts.delete',
    'deals.read', 'deals.write', 'deals.delete',
    'activities.read', 'activities.write',
    'tasks.read', 'tasks.write',
    'communications.read', 'communications.write',
    'consultants.read', 'consultants.write',
    'bench.read', 'bench.write',
    'contracts.read', 'contracts.write',
    'indexation.read', 'indexation.write', 'indexation.approve',
    'revenue.read', 'revenue.write',
    'pipeline.read', 'prognose.read',
    'files.read', 'files.write',
    'users.read',
    'settings.read',
    'audit.read',
    'notifications.read',
  ],

  sales_rep: [
    'dashboard.read',
    'accounts.read', 'accounts.write',
    'contacts.read', 'contacts.write',
    'deals.read', 'deals.write',
    'activities.read', 'activities.write',
    'tasks.read', 'tasks.write',
    'communications.read', 'communications.write',
    'consultants.read',
    'bench.read',
    'contracts.read',
    'indexation.read',
    'revenue.read',
    'pipeline.read', 'prognose.read',
    'files.read',
    'notifications.read',
  ],

  customer_success: [
    'dashboard.read',
    'accounts.read',
    'contacts.read',
    'deals.read',
    'activities.read', 'activities.write',
    'tasks.read', 'tasks.write',
    'communications.read', 'communications.write',
    'consultants.read',
    'bench.read',
    'contracts.read',
    'revenue.read',
    'pipeline.read', 'prognose.read',
    'files.read',
    'notifications.read',
  ],

  marketing: [
    'dashboard.read',
    'accounts.read',
    'contacts.read',
    'deals.read',
    'activities.read',
    'tasks.read',
    'communications.read',
    'pipeline.read',
    'files.read',
    'notifications.read',
  ],
};

export function can(role: Role, permission: Permission): boolean {
  const perms = rolePermissions[role];
  if (perms === 'all') return true;
  return perms.includes(permission);
}
```

- [ ] **Step 3: Update the user_profiles role column migration**

Create `supabase/migrations/00008_update_roles.sql`:

```sql
-- Update the role check constraint to support new roles
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_role_check;
ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_role_check
  CHECK (role IN ('admin', 'sales_manager', 'sales_rep', 'customer_success', 'marketing'));

-- Update the get_user_role function (used by RLS policies)
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role FROM public.user_profiles WHERE id = auth.uid();
$$;
```

- [ ] **Step 4: Update the proxy route permissions**

In `src/proxy.ts`, replace the `routePermissions` array (lines 6-14) with:

```ts
const routePermissions: [string, Permission][] = [
  ['/admin/notifications', 'notifications.read'],
  ['/admin/settings', 'settings.read'],
  ['/admin/users', 'users.read'],
  ['/admin/audit', 'audit.read'],
  ['/admin/files', 'files.read'],
  ['/admin/accounts', 'accounts.read'],
  ['/admin/contacts', 'contacts.read'],
  ['/admin/deals', 'deals.read'],
  ['/admin/activities', 'activities.read'],
  ['/admin/tasks', 'tasks.read'],
  ['/admin/bench', 'bench.read'],
  ['/admin/consultants', 'consultants.read'],
  ['/admin/people', 'hr.read'],
  ['/admin/materials', 'equipment.read'],
  ['/admin/revenue', 'revenue.read'],
  ['/admin/prognose', 'prognose.read'],
  ['/admin/pipeline', 'pipeline.read'],
];
```

This removes the deleted `/admin/contacts` (old) and `/admin/demo` entries and adds all new CRM routes. Routes that don't exist yet will simply never match — no harm.

- [ ] **Step 5: Verify compilation**

```bash
npx next build
```

- [ ] **Step 6: Commit**

```bash
git add src/types/acl.ts src/lib/acl.ts supabase/migrations/00008_update_roles.sql src/proxy.ts
git commit -m "feat: update roles and ACL to CRM permission model"
```

---

## Chunk 2: i18n Setup

### Task 4: Configure next-intl

**Files:**
- Create: `src/i18n/request.ts`
- Create: `messages/nl.json`
- Create: `messages/en.json`
- Modify: `src/app/layout.tsx` (wrap with NextIntlClientProvider)
- Modify: `next.config.ts` (wrap with createNextIntlPlugin)
- Create: `src/middleware.ts` (re-create with auth proxy)

Reference the next-intl App Router docs. Use `@context7` to look up the latest `next-intl` setup for Next.js 16 App Router before implementing, as the API may have changed. No `routing.ts` needed — we use cookie-based locale detection, not URL prefix routing.

- [ ] **Step 1: Create `src/i18n/request.ts`**

```ts
import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const locale = cookieStore.get('locale')?.value ?? 'nl';

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
```

- [ ] **Step 2: Create `messages/nl.json`**

Start with common keys used across the app. Feature-specific keys will be added in each layer:

```json
{
  "common": {
    "save": "Opslaan",
    "cancel": "Annuleren",
    "delete": "Verwijderen",
    "edit": "Bewerken",
    "create": "Aanmaken",
    "search": "Zoeken...",
    "loading": "Laden...",
    "noResults": "Geen resultaten",
    "confirm": "Bevestigen",
    "back": "Terug",
    "actions": "Acties",
    "yes": "Ja",
    "no": "Nee",
    "close": "Sluiten",
    "add": "Toevoegen",
    "remove": "Verwijderen",
    "view": "Bekijken",
    "status": "Status",
    "type": "Type",
    "name": "Naam",
    "email": "E-mail",
    "phone": "Telefoon",
    "notes": "Notities",
    "date": "Datum",
    "year": "Jaar",
    "month": "Maand"
  },
  "nav": {
    "dashboard": "Dashboard",
    "accounts": "Accounts",
    "contacts": "Contacts",
    "deals": "Deals",
    "activities": "Activiteiten",
    "tasks": "Taken",
    "bench": "Bench",
    "consultants": "Consultants",
    "people": "People",
    "materials": "Materiaal",
    "revenue": "Revenue",
    "prognose": "Prognose",
    "pipeline": "Pipeline",
    "settings": "Instellingen",
    "files": "Bestanden",
    "notifications": "Meldingen",
    "audit": "Audit Log",
    "users": "Gebruikers",
    "crm": "CRM",
    "consultancy": "Consultancy",
    "hr": "HR",
    "analyse": "Analyse"
  },
  "auth": {
    "login": "Inloggen",
    "logout": "Uitloggen",
    "register": "Registreren"
  },
  "roles": {
    "admin": "Admin",
    "sales_manager": "Sales Manager",
    "sales_rep": "Sales Rep",
    "customer_success": "Customer Success",
    "marketing": "Marketing"
  }
}
```

- [ ] **Step 3: Create `messages/en.json`**

```json
{
  "common": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit",
    "create": "Create",
    "search": "Search...",
    "loading": "Loading...",
    "noResults": "No results",
    "confirm": "Confirm",
    "back": "Back",
    "actions": "Actions",
    "yes": "Yes",
    "no": "No",
    "close": "Close",
    "add": "Add",
    "remove": "Remove",
    "view": "View",
    "status": "Status",
    "type": "Type",
    "name": "Name",
    "email": "Email",
    "phone": "Phone",
    "notes": "Notes",
    "date": "Date",
    "year": "Year",
    "month": "Month"
  },
  "nav": {
    "dashboard": "Dashboard",
    "accounts": "Accounts",
    "contacts": "Contacts",
    "deals": "Deals",
    "activities": "Activities",
    "tasks": "Tasks",
    "bench": "Bench",
    "consultants": "Consultants",
    "people": "People",
    "materials": "Materials",
    "revenue": "Revenue",
    "prognose": "Forecast",
    "pipeline": "Pipeline",
    "settings": "Settings",
    "files": "Files",
    "notifications": "Notifications",
    "audit": "Audit Log",
    "users": "Users",
    "crm": "CRM",
    "consultancy": "Consultancy",
    "hr": "HR",
    "analyse": "Analytics"
  },
  "auth": {
    "login": "Login",
    "logout": "Logout",
    "register": "Register"
  },
  "roles": {
    "admin": "Admin",
    "sales_manager": "Sales Manager",
    "sales_rep": "Sales Rep",
    "customer_success": "Customer Success",
    "marketing": "Marketing"
  }
}
```

- [ ] **Step 4: Add next-intl plugin to `next.config.ts`**

Replace the entire file. Preserve the existing `nextConfig` object — only change the import and export:

```ts
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  output: 'standalone',
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains',
          },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
```

- [ ] **Step 5: Wrap root layout with `NextIntlClientProvider`**

In `src/app/layout.tsx`, add:

```tsx
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';

export default async function RootLayout({ children }) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

Preserve any existing wrapping (ThemeProvider etc.) — just add `NextIntlClientProvider` around the children.

- [ ] **Step 6: Re-create `src/middleware.ts`**

The original middleware was deleted. Create a new one that combines the existing auth proxy logic with next-intl:

```ts
import { type NextRequest } from 'next/server';
import { proxy, config as proxyConfig } from './proxy';

export async function middleware(request: NextRequest) {
  return proxy(request);
}

export const config = proxyConfig;
```

Note: next-intl middleware is NOT needed here because we use cookie-based locale detection (not URL prefix routing). The locale is read from a `locale` cookie in `src/i18n/request.ts`.

- [ ] **Step 7: Verify i18n works**

```bash
npx next dev
```

Visit `/admin` — page should render. No visible changes yet (labels not wired up), but no errors.

- [ ] **Step 8: Commit**

```bash
git add src/i18n/ messages/ src/middleware.ts src/app/layout.tsx next.config.ts
git commit -m "feat: set up next-intl with NL/EN locale support"
```

---

## Chunk 3: Foundation Database Tables

### Task 5: Create pipelines and stages migration

**Files:**
- Create: `supabase/migrations/00009_pipelines_and_stages.sql`

- [ ] **Step 1: Write the migration**

```sql
-- Pipelines table
CREATE TABLE pipelines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('projecten', 'rfp', 'consultancy')),
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Pipeline stages
CREATE TABLE pipeline_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id uuid NOT NULL REFERENCES pipelines(id) ON DELETE CASCADE,
  name text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  probability int NOT NULL DEFAULT 0 CHECK (probability >= 0 AND probability <= 100),
  color text NOT NULL DEFAULT '#6366f1',
  is_closed boolean NOT NULL DEFAULT false,
  is_won boolean NOT NULL DEFAULT false,
  is_longterm boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_pipeline_stages_pipeline_id ON pipeline_stages(pipeline_id);

-- Updated_at triggers
CREATE TRIGGER set_pipelines_updated_at
  BEFORE UPDATE ON pipelines
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_pipeline_stages_updated_at
  BEFORE UPDATE ON pipeline_stages
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS
ALTER TABLE pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_stages ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read pipelines and stages
CREATE POLICY "Authenticated users can read pipelines"
  ON pipelines FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can read pipeline stages"
  ON pipeline_stages FOR SELECT TO authenticated USING (true);

-- Only admins can modify pipelines
CREATE POLICY "Admins can insert pipelines"
  ON pipelines FOR INSERT TO authenticated
  WITH CHECK (get_user_role() = 'admin');

CREATE POLICY "Admins can update pipelines"
  ON pipelines FOR UPDATE TO authenticated
  USING (get_user_role() = 'admin');

CREATE POLICY "Admins can delete pipelines"
  ON pipelines FOR DELETE TO authenticated
  USING (get_user_role() = 'admin');

-- Only admins can modify stages
CREATE POLICY "Admins can insert pipeline stages"
  ON pipeline_stages FOR INSERT TO authenticated
  WITH CHECK (get_user_role() = 'admin');

CREATE POLICY "Admins can update pipeline stages"
  ON pipeline_stages FOR UPDATE TO authenticated
  USING (get_user_role() = 'admin');

CREATE POLICY "Admins can delete pipeline stages"
  ON pipeline_stages FOR DELETE TO authenticated
  USING (get_user_role() = 'admin');

-- Seed the 3 pipelines with stages
INSERT INTO pipelines (id, name, type, sort_order) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Projecten', 'projecten', 1),
  ('00000000-0000-0000-0000-000000000002', 'RFP', 'rfp', 2),
  ('00000000-0000-0000-0000-000000000003', 'Consultancy Profielen', 'consultancy', 3);

-- Projecten stages
INSERT INTO pipeline_stages (pipeline_id, name, sort_order, probability, color, is_closed, is_won, is_longterm) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Lead',           1,  10, '#6366f1', false, false, false),
  ('00000000-0000-0000-0000-000000000001', 'Meeting',        2,  25, '#8b5cf6', false, false, false),
  ('00000000-0000-0000-0000-000000000001', 'Demo',           3,  40, '#a855f7', false, false, false),
  ('00000000-0000-0000-0000-000000000001', 'Voorstel',       4,  60, '#d946ef', false, false, false),
  ('00000000-0000-0000-0000-000000000001', 'Onderhandeling', 5,  80, '#ec4899', false, false, false),
  ('00000000-0000-0000-0000-000000000001', 'Gewonnen',       6, 100, '#22c55e', true,  true,  false),
  ('00000000-0000-0000-0000-000000000001', 'Verloren',       7,   0, '#ef4444', true,  false, false),
  ('00000000-0000-0000-0000-000000000001', 'Longterm',       8,   0, '#f59e0b', true,  false, true);

-- RFP stages
INSERT INTO pipeline_stages (pipeline_id, name, sort_order, probability, color, is_closed, is_won, is_longterm) VALUES
  ('00000000-0000-0000-0000-000000000002', 'Ontvangen',        1,  10, '#06b6d4', false, false, false),
  ('00000000-0000-0000-0000-000000000002', 'Kandidaatstelling', 2, 25, '#0891b2', false, false, false),
  ('00000000-0000-0000-0000-000000000002', 'RFI',              3,  40, '#0e7490', false, false, false),
  ('00000000-0000-0000-0000-000000000002', 'RFP',              4,  60, '#0c4a6e', false, false, false),
  ('00000000-0000-0000-0000-000000000002', 'Onderhandeling',   5,  80, '#1e3a5f', false, false, false),
  ('00000000-0000-0000-0000-000000000002', 'Gewonnen',         6, 100, '#22c55e', true,  true,  false),
  ('00000000-0000-0000-0000-000000000002', 'Verloren',         7,   0, '#ef4444', true,  false, false),
  ('00000000-0000-0000-0000-000000000002', 'Longterm',         8,   0, '#f59e0b', true,  false, true);

-- Consultancy Profielen stages
INSERT INTO pipeline_stages (pipeline_id, name, sort_order, probability, color, is_closed, is_won, is_longterm) VALUES
  ('00000000-0000-0000-0000-000000000003', 'Lead',             1,  10, '#14b8a6', false, false, false),
  ('00000000-0000-0000-0000-000000000003', 'CV/Info',          2,  25, '#0d9488', false, false, false),
  ('00000000-0000-0000-0000-000000000003', 'Intake',           3,  50, '#0f766e', false, false, false),
  ('00000000-0000-0000-0000-000000000003', 'Contract',         4,  75, '#115e59', false, false, false),
  ('00000000-0000-0000-0000-000000000003', 'Geplaatst',        5, 100, '#22c55e', true,  true,  false),
  ('00000000-0000-0000-0000-000000000003', 'Niet weerhouden',  6,   0, '#ef4444', true,  false, false);
```

- [ ] **Step 2: Apply migration locally**

```bash
npx supabase migration up
```

If you need a clean slate (will wipe all local data): `npx supabase db reset`

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/00009_pipelines_and_stages.sql
git commit -m "feat: add pipelines and stages tables with seed data"
```

---

### Task 6: Create indexation indices migration

**Files:**
- Create: `supabase/migrations/00010_indexation_indices.sql`

- [ ] **Step 1: Write the migration**

```sql
-- Reference table for indexation percentages (e.g. Agoria indices)
CREATE TABLE indexation_indices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  value numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_indexation_indices_updated_at
  BEFORE UPDATE ON indexation_indices
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE indexation_indices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read indexation indices"
  ON indexation_indices FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage indexation indices"
  ON indexation_indices FOR ALL TO authenticated
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

-- Seed
INSERT INTO indexation_indices (name, value) VALUES
  ('Agoria', 3.1),
  ('Agoria Digital', 2.8);
```

- [ ] **Step 2: Commit**

```bash
git add supabase/migrations/00010_indexation_indices.sql
git commit -m "feat: add indexation indices reference table"
```

---

## Chunk 4: Shared Components

### Task 7: Restructure sidebar navigation

**Files:**
- Modify: `src/components/layout/admin-sidebar.tsx`

- [ ] **Step 1: Rewrite sidebar with 4-section CRM navigation**

Replace the entire file. Use `useTranslations` from `next-intl` for labels:

```tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  Building2,
  Users,
  TrendingUp,
  Activity,
  CheckSquare,
  FileText,
  Settings,
  Bell,
  ScrollText,
  UserPlus,
  Wrench,
  DollarSign,
  Target,
  Layers,
  Briefcase,
  Contact,
} from 'lucide-react';

export function AdminSidebar() {
  const pathname = usePathname();
  const t = useTranslations('nav');

  const navSections = [
    {
      section: t('crm'),
      items: [
        { label: t('dashboard'), href: '/admin', icon: LayoutDashboard },
        { label: t('accounts'), href: '/admin/accounts', icon: Building2 },
        { label: t('contacts'), href: '/admin/contacts', icon: Contact },
        { label: t('deals'), href: '/admin/deals', icon: TrendingUp },
        { label: t('activities'), href: '/admin/activities', icon: Activity },
        { label: t('tasks'), href: '/admin/tasks', icon: CheckSquare },
      ],
    },
    {
      section: t('consultancy'),
      items: [
        { label: t('bench'), href: '/admin/bench', icon: Briefcase },
        { label: t('consultants'), href: '/admin/consultants', icon: Users },
      ],
    },
    {
      section: t('hr'),
      items: [
        { label: t('people'), href: '/admin/people', icon: UserPlus },
        { label: t('materials'), href: '/admin/materials', icon: Wrench },
      ],
    },
    {
      section: t('analyse'),
      items: [
        { label: t('revenue'), href: '/admin/revenue', icon: DollarSign },
        { label: t('prognose'), href: '/admin/prognose', icon: Target },
        { label: t('pipeline'), href: '/admin/pipeline', icon: Layers },
      ],
    },
    {
      section: null, // no label, separator group
      items: [
        { label: t('files'), href: '/admin/files', icon: FileText },
        { label: t('notifications'), href: '/admin/notifications', icon: Bell },
        { label: t('audit'), href: '/admin/audit', icon: ScrollText },
        { label: t('users'), href: '/admin/users', icon: Users },
        { label: t('settings'), href: '/admin/settings', icon: Settings },
      ],
    },
  ];

  return (
    <Sidebar>
      <SidebarHeader className="flex h-14 items-center border-b px-4">
        <Link href="/admin" className="text-lg font-bold">
          PHPro CRM
        </Link>
      </SidebarHeader>
      <SidebarContent>
        {navSections.map((section, idx) => (
          <SidebarGroup key={idx}>
            {section.section && (
              <SidebarGroupLabel>{section.section}</SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => {
                  const isActive =
                    item.href === '/admin'
                      ? pathname === '/admin'
                      : pathname.startsWith(item.href);
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        isActive={isActive}
                        render={<Link href={item.href} />}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="border-t p-4">
        <p className="text-xs text-muted-foreground">PHPro CRM</p>
      </SidebarFooter>
    </Sidebar>
  );
}
```

- [ ] **Step 2: Add locale switcher to topbar**

In `src/components/layout/admin-topbar.tsx`, add a simple NL/EN toggle button. It should set a `locale` cookie and reload the page:

```tsx
'use client';

import { useLocale } from 'next-intl';

function LocaleSwitcher() {
  const locale = useLocale();

  const switchLocale = (newLocale: string) => {
    document.cookie = `locale=${newLocale};path=/;max-age=31536000`;
    window.location.reload();
  };

  return (
    <button
      onClick={() => switchLocale(locale === 'nl' ? 'en' : 'nl')}
      className="rounded-lg border px-2 py-1.5 text-xs font-medium hover:bg-accent"
    >
      {locale === 'nl' ? 'EN' : 'NL'}
    </button>
  );
}
```

Add `<LocaleSwitcher />` next to the existing theme toggle in the topbar.

- [ ] **Step 3: Verify sidebar renders correctly**

```bash
npx next dev
```

Visit `/admin` — should see 4 labeled sections (CRM, Consultancy, HR, Analyse) plus the system links. Most links will 404 — that's expected, routes don't exist yet.

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/admin-sidebar.tsx src/components/layout/admin-topbar.tsx
git commit -m "feat: restructure sidebar with CRM navigation sections and locale switcher"
```

---

### Task 8: Create shared UI components

**Files:**
- Create: `src/components/admin/modal.tsx`
- Create: `src/components/admin/info-row.tsx`
- Create: `src/components/admin/section-card.tsx`
- Create: `src/components/admin/health-bar.tsx`
- Create: `src/components/admin/chip-select.tsx`
- Create: `src/components/admin/currency-input.tsx`
- Create: `src/components/admin/pdf-upload-field.tsx`
- Create: `src/components/admin/rich-text-editor.tsx`
- Create: `src/components/admin/kanban-board.tsx`

These are generic, reusable components used across features. Each one is a self-contained file.

- [ ] **Step 1: Create `src/components/admin/modal.tsx`**

Generic modal wrapping shadcn `Dialog`. Three sizes: default, wide, extra-wide.

```tsx
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'default' | 'wide' | 'extra-wide';
};

const sizeClasses = {
  default: 'sm:max-w-lg',
  wide: 'sm:max-w-2xl',
  'extra-wide': 'sm:max-w-4xl',
};

export function Modal({ open, onClose, title, children, size = 'default' }: ModalProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className={cn(sizeClasses[size], 'max-h-[92vh] overflow-y-auto')}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Create `src/components/admin/info-row.tsx`**

```tsx
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type InfoRowProps = {
  label: string;
  value?: React.ReactNode;
  icon?: LucideIcon;
  href?: string;
  mono?: boolean;
};

export function InfoRow({ label, value, icon: Icon, href, mono }: InfoRowProps) {
  return (
    <div className="flex items-start gap-2.5 border-b border-muted/50 py-2 last:border-0">
      {Icon && <Icon className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />}
      <span className="w-28 flex-shrink-0 text-xs font-medium text-muted-foreground">
        {label}
      </span>
      <span className={cn('min-w-0 flex-1 text-sm', mono && 'font-mono text-xs')}>
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="truncate text-primary hover:underline"
          >
            {value}
          </a>
        ) : (
          value ?? <span className="text-muted-foreground/40">—</span>
        )}
      </span>
    </div>
  );
}
```

- [ ] **Step 3: Create `src/components/admin/section-card.tsx`**

```tsx
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type SectionCardProps = {
  title: string;
  icon?: LucideIcon;
  iconClassName?: string;
  children: React.ReactNode;
  className?: string;
};

export function SectionCard({ title, icon: Icon, iconClassName, children, className }: SectionCardProps) {
  return (
    <div className={cn('overflow-hidden rounded-xl border', className)}>
      <div className="flex items-center gap-2 border-b bg-muted/50 px-4 py-3">
        {Icon && <Icon className={cn('h-3.5 w-3.5', iconClassName)} />}
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
        </span>
      </div>
      <div className="px-4 py-3">{children}</div>
    </div>
  );
}
```

- [ ] **Step 4: Create `src/components/admin/health-bar.tsx`**

```tsx
import { cn } from '@/lib/utils';

type HealthBarProps = {
  score: number;
};

export function HealthBar({ score }: HealthBarProps) {
  const color = score >= 70 ? 'bg-green-500' : score >= 40 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-20 overflow-hidden rounded-full bg-muted">
        <div className={cn('h-full rounded-full', color)} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs font-medium text-muted-foreground">{score}</span>
    </div>
  );
}
```

- [ ] **Step 5: Create `src/components/admin/chip-select.tsx`**

Multi-select input with autocomplete suggestions. Used for technologies, hobbies, roles, languages.

```tsx
'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

type ChipSelectProps = {
  label?: string;
  values: string[];
  onChange: (values: string[]) => void;
  suggestions: string[];
  placeholder?: string;
};

export function ChipSelect({ label, values, onChange, suggestions, placeholder = 'Toevoegen...' }: ChipSelectProps) {
  const [input, setInput] = useState('');

  const add = (v: string) => {
    const t = v.trim();
    if (!t || values.includes(t)) return;
    onChange([...values, t]);
    setInput('');
  };

  const remove = (v: string) => onChange(values.filter((x) => x !== v));

  const filtered = suggestions
    .filter((s) => !values.includes(s) && s.toLowerCase().includes(input.toLowerCase()))
    .slice(0, 6);

  return (
    <div>
      {label && <label className="mb-1 block text-sm font-medium">{label}</label>}
      <div className="mb-2 flex flex-wrap gap-1.5">
        {values.map((v) => (
          <span
            key={v}
            className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/5 py-1 pl-2.5 pr-1 text-xs font-medium text-primary"
          >
            {v}
            <button
              type="button"
              onClick={() => remove(v)}
              className="flex h-4 w-4 items-center justify-center rounded-full hover:bg-primary/10"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </span>
        ))}
      </div>
      <div className="relative">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add(input);
            }
          }}
          placeholder={placeholder}
          className="w-full rounded-lg border px-3 py-2 text-sm"
        />
        {input.length > 0 && filtered.length > 0 && (
          <div className="absolute z-10 mt-1 max-h-40 w-full overflow-y-auto rounded-lg border bg-popover shadow-lg">
            {filtered.map((s) => (
              <button
                key={s}
                onClick={() => add(s)}
                className="w-full px-3 py-2 text-left text-sm hover:bg-accent"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Create `src/components/admin/currency-input.tsx`**

```tsx
'use client';

import { cn } from '@/lib/utils';

type CurrencyInputProps = {
  value: number | string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  suffix?: string;
};

export function CurrencyInput({ value, onChange, placeholder, className, suffix }: CurrencyInputProps) {
  return (
    <div className={cn('flex items-center gap-1', className)}>
      <span className="text-sm text-muted-foreground">€</span>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border px-2.5 py-1.5 text-right text-sm"
      />
      {suffix && <span className="text-xs text-muted-foreground">{suffix}</span>}
    </div>
  );
}
```

- [ ] **Step 7: Create `src/components/admin/pdf-upload-field.tsx`**

Uploads to Supabase Storage `documents` bucket. Returns the public URL.

```tsx
'use client';

import { useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createBrowserClient } from '@/lib/supabase/client';

type PdfUploadFieldProps = {
  label: string;
  value: string;
  onChange: (url: string) => void;
  bucket?: string;
  folder?: string;
};

export function PdfUploadField({ label, value, onChange, bucket = 'documents', folder = '' }: PdfUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const supabase = createBrowserClient();
      const path = folder ? `${folder}/${file.name}` : file.name;
      const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
      if (error) throw error;

      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      onChange(data.publicUrl);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-muted-foreground">{label}</label>
      <div className="flex items-center gap-2">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="URL of bestandsnaam"
          className="flex-1 rounded-lg border px-2.5 py-1.5 text-xs"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          <Upload className="mr-1 h-3 w-3" />
          {uploading ? '...' : 'Upload'}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.doc,.docx"
          className="hidden"
          onChange={handleFile}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 8: Create `src/components/admin/rich-text-editor.tsx`**

Plate editor wrapper. This is a placeholder that will need adjustment based on the exact Plate API at time of implementation. Use `@context7` to look up the current Plate setup docs.

```tsx
'use client';

import { useState } from 'react';

type RichTextEditorProps = {
  value: any; // Plate JSON value
  onChange: (value: any) => void;
  placeholder?: string;
};

/**
 * Plate rich text editor wrapper.
 *
 * TODO: Wire up actual Plate editor during implementation.
 * The Plate API changes frequently. Use context7 to look up the current
 * setup for @udecode/plate with React 19 before implementing.
 *
 * Expected plugins: bold, italic, underline, heading, list, link, paragraph.
 * Store format: Plate JSON (serializable to/from JSONB in Supabase).
 */
export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  // Temporary fallback: plain textarea until Plate is wired up
  const [text, setText] = useState(typeof value === 'string' ? value : '');

  return (
    <textarea
      value={text}
      onChange={(e) => {
        setText(e.target.value);
        onChange(e.target.value);
      }}
      placeholder={placeholder ?? 'Schrijf hier...'}
      rows={6}
      className="w-full rounded-lg border px-3 py-2 text-sm"
    />
  );
}
```

- [ ] **Step 9: Create `src/components/admin/kanban-board.tsx`**

Generic kanban board using @dnd-kit. Columns and cards are generic — features provide the card renderer.

```tsx
'use client';

import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';

type KanbanColumn<T> = {
  id: string;
  title: string;
  color: string;
  items: T[];
};

type KanbanBoardProps<T extends { id: string }> = {
  columns: KanbanColumn<T>[];
  renderCard: (item: T) => React.ReactNode;
  onDragEnd: (itemId: string, targetColumnId: string) => void;
};

function SortableCard<T extends { id: string }>({
  item,
  renderCard,
}: {
  item: T;
  renderCard: (item: T) => React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(isDragging && 'opacity-50')}
    >
      {renderCard(item)}
    </div>
  );
}

export function KanbanBoard<T extends { id: string }>({
  columns,
  renderCard,
  onDragEnd,
}: KanbanBoardProps<T>) {
  const [activeItem, setActiveItem] = useState<T | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const allItems = columns.flatMap((c) => c.items);

  const handleDragStart = (event: DragStartEvent) => {
    const item = allItems.find((i) => i.id === event.active.id);
    if (item) setActiveItem(item);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveItem(null);
    const { active, over } = event;
    if (!over) return;

    const targetColumn = columns.find(
      (c) => c.id === over.id || c.items.some((i) => i.id === over.id),
    );
    if (targetColumn) {
      onDragEnd(String(active.id), targetColumn.id);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((column) => (
          <div key={column.id} className="w-72 flex-shrink-0">
            <div className="mb-3 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: column.color }} />
              <span className="text-sm font-semibold">{column.title}</span>
              <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                {column.items.length}
              </span>
            </div>
            <SortableContext
              id={column.id}
              items={column.items.map((i) => i.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {column.items.map((item) => (
                  <SortableCard key={item.id} item={item} renderCard={renderCard} />
                ))}
              </div>
            </SortableContext>
          </div>
        ))}
      </div>
      <DragOverlay>{activeItem ? renderCard(activeItem) : null}</DragOverlay>
    </DndContext>
  );
}
```

- [ ] **Step 10: Verify all components compile**

```bash
npx next build
```

- [ ] **Step 11: Commit**

```bash
git add src/components/admin/modal.tsx src/components/admin/info-row.tsx src/components/admin/section-card.tsx src/components/admin/health-bar.tsx src/components/admin/chip-select.tsx src/components/admin/currency-input.tsx src/components/admin/pdf-upload-field.tsx src/components/admin/rich-text-editor.tsx src/components/admin/kanban-board.tsx
git commit -m "feat: add shared CRM components (modal, kanban, chip-select, etc.)"
```

---

## Chunk 5: Regenerate Types & Final Verification

### Task 9: Regenerate Supabase types

**Files:**
- Modify: `src/types/database.ts`

- [ ] **Step 1: Reset and regenerate**

```bash
npx supabase db reset
npx supabase gen types typescript --local > src/types/database.ts
```

- [ ] **Step 2: Verify the generated types include new tables**

Open `src/types/database.ts` and confirm it has `pipelines`, `pipeline_stages`, and `indexation_indices` table types.

- [ ] **Step 3: Commit**

```bash
git add src/types/database.ts
git commit -m "chore: regenerate Supabase types with new tables"
```

---

### Task 10: Full build verification

- [ ] **Step 1: Run full build**

```bash
npx next build
```

Expected: Build succeeds with no errors.

- [ ] **Step 2: Start dev server and smoke test**

```bash
npx next dev
```

Verify:
- `/admin` — Dashboard renders, sidebar shows 4 CRM sections
- Locale switcher toggles NL/EN (sidebar labels change)
- All existing features still work: `/admin/files`, `/admin/notifications`, `/admin/audit`, `/admin/users`, `/admin/settings`
- Auth flow works (login/logout)

- [ ] **Step 3: Final commit if any fixes were needed**

```bash
git add -A
git commit -m "fix: resolve build issues from Layer 1 foundation"
```

---

## Summary

Layer 1 delivers:
- Old contacts and demo pages removed
- 3 new dependencies installed (next-intl, @dnd-kit, Plate)
- 5 roles with 30+ permissions configured
- next-intl with NL/EN and locale switcher
- Sidebar restructured into 4 CRM sections
- 2 foundation migrations (pipelines/stages, indexation indices)
- 9 shared components ready for use by all feature layers
- Middleware restored

**Next:** Layer 2 (Core CRM — Accounts, Contacts, Communications) builds on this foundation.
