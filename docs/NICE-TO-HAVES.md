# Nice-to-Haves

Per-project additions you can layer onto the template. Each section is self-contained and follows the existing architecture (feature folders under `src/`, Supabase for data, Next.js App Router).

---

## 1. Event Bus / Dispatcher

**What it is:** A typed pub/sub system that decouples features by letting them emit and listen for domain events without importing each other.

**When you need it:** When actions in one feature trigger side effects in others (e.g., creating a contact should also send a notification and write an audit log).

**How to add it:**

Create `src/lib/event-bus.ts`:

```ts
type EventMap = {
  'contact.created': { contactId: string; createdBy: string };
  'contact.deleted': { contactId: string; deletedBy: string };
  'user.invited': { email: string; role: string; invitedBy: string };
};

type EventHandler<T> = (payload: T) => void | Promise<void>;

const listeners = new Map<string, Set<EventHandler<unknown>>>();

export function on<K extends keyof EventMap>(
  event: K,
  handler: EventHandler<EventMap[K]>,
) {
  if (!listeners.has(event)) listeners.set(event, new Set());
  listeners.get(event)!.add(handler as EventHandler<unknown>);
  return () => listeners.get(event)?.delete(handler as EventHandler<unknown>);
}

export async function emit<K extends keyof EventMap>(
  event: K,
  payload: EventMap[K],
) {
  const handlers = listeners.get(event);
  if (!handlers) return;
  await Promise.allSettled(
    [...handlers].map((handler) => handler(payload)),
  );
}
```

Register listeners in a bootstrap file (e.g., `src/lib/event-listeners.ts`), imported once in `src/app/layout.tsx` on the server side:

```ts
import { on } from '@/lib/event-bus';

on('contact.created', async ({ contactId, createdBy }) => {
  // Write audit log, send notification, etc.
  console.log(`Contact ${contactId} created by ${createdBy}`);
});
```

---

## 2. Feature Flags

**What it is:** A database-backed toggle system that lets you enable or disable features per-environment or per-user without redeploying.

**When you need it:** Staged rollouts, beta features for specific users, or kill-switches for features in production.

**How to add it:**

### Migration (`supabase/migrations/00010_feature_flags.sql`)

```sql
CREATE TABLE IF NOT EXISTS public.feature_flags (
  key text PRIMARY KEY,
  enabled boolean NOT NULL DEFAULT false,
  description text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_can_read_flags" ON public.feature_flags
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "admins_can_manage_flags" ON public.feature_flags
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP TRIGGER IF EXISTS set_updated_at ON public.feature_flags;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.feature_flags
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.feature_flags (key, enabled, description) VALUES
  ('beta_dashboard', false, 'New dashboard redesign'),
  ('export_csv', true, 'CSV export on contacts page');
```

### Helper (`src/lib/feature-flags.ts`)

```ts
import { cache } from 'react';
import { createServerClient } from '@/lib/supabase/server';

export const isFeatureEnabled = cache(async (key: string): Promise<boolean> => {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from('feature_flags')
    .select('enabled')
    .eq('key', key)
    .single();
  return data?.enabled ?? false;
});
```

### Usage in a Server Component

```tsx
import { isFeatureEnabled } from '@/lib/feature-flags';

export default async function ContactsPage() {
  const showExport = await isFeatureEnabled('export_csv');

  return (
    <div>
      <h1>Contacts</h1>
      {showExport && <ExportButton />}
    </div>
  );
}
```

---

## 3. Stripe / Billing

**What it is:** Subscription billing integration using Stripe Checkout, Customer Portal, and webhooks synced to a local `subscriptions` table.

**When you need it:** SaaS products that charge recurring fees, need plan-gating, or usage-based billing.

**How to add it:**

### Migration (`supabase/migrations/00011_subscriptions.sql`)

```sql
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id text PRIMARY KEY,                         -- Stripe subscription ID
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id text NOT NULL,
  status text NOT NULL DEFAULT 'incomplete',   -- active, canceled, past_due, etc.
  price_id text NOT NULL,
  current_period_end timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_can_read_own_subscription" ON public.subscriptions
  FOR SELECT TO authenticated USING (user_id = auth.uid());
```

### Webhook handler (`src/app/api/webhooks/stripe/route.ts`)

```ts
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature')!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription;
      await supabaseAdmin.from('subscriptions').upsert({
        id: sub.id,
        user_id: sub.metadata.user_id,
        stripe_customer_id: sub.customer as string,
        status: sub.status,
        price_id: sub.items.data[0].price.id,
        current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
      });
      break;
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      await supabaseAdmin
        .from('subscriptions')
        .update({ status: 'canceled' })
        .eq('id', sub.id);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
```

### Checkout helper (`src/lib/stripe.ts`)

```ts
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function createCheckoutSession(userId: string, priceId: string) {
  return stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/admin?checkout=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/admin?checkout=cancel`,
    subscription_data: { metadata: { user_id: userId } },
  });
}
```

---

## 4. Sentry / Error Tracking

**What it is:** Automatic error capture and performance monitoring for both client and server, with source maps for readable stack traces.

**When you need it:** Any production deployment where you need visibility into errors users encounter.

**How to add it:**

```bash
npx @sentry/wizard@latest -i nextjs
```

This creates the config files automatically. The key files:

### `sentry.client.config.ts`

```ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 1.0,
  integrations: [Sentry.replayIntegration()],
});
```

### `sentry.server.config.ts`

```ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
});
```

### `next.config.ts` addition

```ts
import { withSentryConfig } from '@sentry/nextjs';

const nextConfig = {
  // your existing config
};

export default withSentryConfig(nextConfig, {
  org: 'your-org',
  project: 'your-project',
  silent: true,
  widenClientFileUpload: true,
  hideSourceMaps: true,
});
```

### Env vars to add

```
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
SENTRY_AUTH_TOKEN=sntrys_xxx
```

---

## 5. PostHog / Analytics

**What it is:** Product analytics that tracks user behavior, feature usage, and funnels without sending data to third-party ad networks.

**When you need it:** When you want to understand how users interact with the app, which features get used, and where users drop off.

**How to add it:**

### Provider (`src/components/posthog-provider.tsx`)

```tsx
'use client';

import posthog from 'posthog-js';
import { PostHogProvider as PHProvider } from 'posthog-js/react';
import { useEffect } from 'react';

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
      person_profiles: 'identified_only',
      capture_pageview: false, // we handle this manually with the App Router
    });
  }, []);

  return <PHProvider client={posthog}>{children}</PHProvider>;
}
```

### Page view tracker (`src/components/posthog-pageview.tsx`)

```tsx
'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import posthog from 'posthog-js';

export function PostHogPageview() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (pathname) {
      let url = window.origin + pathname;
      if (searchParams?.toString()) url += `?${searchParams.toString()}`;
      posthog.capture('$pageview', { $current_url: url });
    }
  }, [pathname, searchParams]);

  return null;
}
```

### Add to root layout (`src/app/layout.tsx`)

```tsx
import { PostHogProvider } from '@/components/posthog-provider';
import { PostHogPageview } from '@/components/posthog-pageview';

// Inside the <body>:
<PostHogProvider>
  <PostHogPageview />
  {children}
</PostHogProvider>
```

### Typed event helper (`src/lib/analytics.ts`)

```ts
import posthog from 'posthog-js';

type AnalyticsEvent =
  | { event: 'contact_created'; properties: { contactId: string } }
  | { event: 'file_uploaded'; properties: { fileSize: number; mimeType: string } }
  | { event: 'user_invited'; properties: { role: string } };

export function trackEvent<T extends AnalyticsEvent>(
  event: T['event'],
  properties: T['properties'],
) {
  posthog.capture(event, properties);
}
```

---

## 6. Activity Feed UI

**What it is:** A user-facing timeline that shows recent actions (created contact, uploaded file, changed settings) by querying the existing audit system.

**When you need it:** When users or admins want to see a chronological feed of what happened in the app.

**How to add it:**

This assumes you have an `audit_logs` table. If not, create one first:

### Migration (`supabase/migrations/00012_audit_logs.sql`)

```sql
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,               -- e.g. 'contact.created', 'file.uploaded'
  entity_type text NOT NULL,           -- e.g. 'contact', 'file'
  entity_id text,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_logs_created_at ON public.audit_logs (created_at DESC);
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs (user_id);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_can_read_audit_logs" ON public.audit_logs
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin')
  );
```

### Server helper (`src/lib/audit.ts`)

```ts
import { createServerClient } from '@/lib/supabase/server';

export async function logAuditEvent(params: {
  userId: string;
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}) {
  const supabase = await createServerClient();
  await supabase.from('audit_logs').insert({
    user_id: params.userId,
    action: params.action,
    entity_type: params.entityType,
    entity_id: params.entityId ?? null,
    metadata: params.metadata ?? {},
  });
}
```

### Activity Feed component (`src/components/admin/activity-feed.tsx`)

```tsx
import { createServerClient } from '@/lib/supabase/server';
import { formatDistanceToNow } from 'date-fns';

const actionLabels: Record<string, string> = {
  'contact.created': 'created a contact',
  'contact.updated': 'updated a contact',
  'contact.deleted': 'deleted a contact',
  'file.uploaded': 'uploaded a file',
  'user.invited': 'invited a user',
};

export async function ActivityFeed({ limit = 20 }: { limit?: number }) {
  const supabase = await createServerClient();
  const { data: logs } = await supabase
    .from('audit_logs')
    .select('*, user_profiles(full_name, avatar_url)')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (!logs?.length) {
    return <p className="text-muted-foreground text-sm">No recent activity.</p>;
  }

  return (
    <ul className="space-y-3">
      {logs.map((log) => (
        <li key={log.id} className="flex items-start gap-3 text-sm">
          <div className="bg-muted h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium">
            {(log.user_profiles as { full_name: string })?.full_name?.[0] ?? '?'}
          </div>
          <div>
            <p>
              <span className="font-medium">
                {(log.user_profiles as { full_name: string })?.full_name ?? 'Unknown'}
              </span>{' '}
              {actionLabels[log.action] ?? log.action}
            </p>
            <p className="text-muted-foreground text-xs">
              {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
```

### Usage

```tsx
// In any admin page:
import { ActivityFeed } from '@/components/admin/activity-feed';

export default function DashboardPage() {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
      <ActivityFeed limit={10} />
    </div>
  );
}
```

---

## 7. E2E Tests (Playwright)

**What it is:** Browser-based end-to-end tests that simulate real user interactions and catch regressions in auth flows, navigation, and form submissions.

**When you need it:** CI/CD pipelines where you want automated regression testing before each deployment.

**How to add it:**

```bash
npm init playwright@latest
```

### Config (`playwright.config.ts`)

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

### Auth flow test (`e2e/auth.spec.ts`)

```ts
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('redirects unauthenticated users from /admin to /login', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/login/);
  });

  test('login form accepts credentials and redirects to /admin', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('admin@example.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/admin/);
  });

  test('authenticated user is redirected away from /login', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.getByLabel('Email').fill('admin@example.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/admin/);

    // Try to visit login again
    await page.goto('/login');
    await expect(page).toHaveURL(/\/admin/);
  });
});
```

### Add to `Taskfile.yml`

```yaml
test:e2e:
  desc: Run Playwright E2E tests
  cmds:
    - npx playwright test

test:e2e:ui:
  desc: Run Playwright tests in UI mode
  cmds:
    - npx playwright test --ui
```

---

## 8. Multi-Tenant (Organizations)

**What it is:** An organization/team layer that groups users under shared accounts, with RLS policies that scope data access per organization.

**When you need it:** When users need to collaborate in teams or companies, each with their own isolated data.

**How to add it:**

### Migration (`supabase/migrations/00013_organizations.sql`)

```sql
CREATE TABLE IF NOT EXISTS public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.organization_members (
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (organization_id, user_id)
);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- Users can read orgs they belong to
CREATE POLICY "members_can_read_org" ON public.organizations
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_id = id AND user_id = auth.uid()
    )
  );

-- Only owners can update org
CREATE POLICY "owners_can_update_org" ON public.organizations
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_id = id AND user_id = auth.uid() AND role = 'owner'
    )
  );

-- Members can read membership of their own orgs
CREATE POLICY "members_can_read_members" ON public.organization_members
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = organization_id AND om.user_id = auth.uid()
    )
  );

-- Owners/admins can manage members
CREATE POLICY "admins_can_manage_members" ON public.organization_members
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = organization_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner', 'admin')
    )
  );

-- Helper function for RLS on org-scoped tables
CREATE OR REPLACE FUNCTION public.user_belongs_to_org(org_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = org_id AND user_id = auth.uid()
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

DROP TRIGGER IF EXISTS set_updated_at ON public.organizations;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
```

### Scoping existing tables

Add `organization_id` to tables that need tenant isolation (e.g., contacts):

```sql
ALTER TABLE public.contacts ADD COLUMN organization_id uuid REFERENCES public.organizations(id);

-- Replace the existing SELECT policy with an org-scoped one:
DROP POLICY IF EXISTS "authenticated_can_read_contacts" ON public.contacts;
CREATE POLICY "org_members_can_read_contacts" ON public.contacts
  FOR SELECT TO authenticated USING (
    public.user_belongs_to_org(organization_id)
  );
```

---

## 9. Rate Limiting

**What it is:** Request throttling that prevents abuse by limiting how many requests a client can make to an endpoint within a time window.

**When you need it:** Public-facing API routes, auth endpoints, or any route vulnerable to brute-force or spam.

**How to add it:**

### In-memory rate limiter (no external dependencies)

Create `src/lib/rate-limit.ts`:

```ts
const hits = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(options: { limit: number; windowMs: number }) {
  return {
    check(key: string): { success: boolean; remaining: number } {
      const now = Date.now();
      const record = hits.get(key);

      if (!record || now > record.resetAt) {
        hits.set(key, { count: 1, resetAt: now + options.windowMs });
        return { success: true, remaining: options.limit - 1 };
      }

      if (record.count >= options.limit) {
        return { success: false, remaining: 0 };
      }

      record.count++;
      return { success: true, remaining: options.limit - record.count };
    },
  };
}
```

### Usage in an API route

```ts
import { NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';

const limiter = rateLimit({ limit: 10, windowMs: 60_000 }); // 10 req/min

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
  const { success, remaining } = limiter.check(ip);

  if (!success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': '60' } },
    );
  }

  // ... handle request
  return NextResponse.json({ ok: true }, {
    headers: { 'X-RateLimit-Remaining': String(remaining) },
  });
}
```

### Production alternative: Upstash Redis

For multi-instance deployments where in-memory state is not shared:

```bash
npm install @upstash/ratelimit @upstash/redis
```

```ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '60 s'),
});

// In your route:
const { success } = await ratelimit.limit(ip);
```

---

## 10. CAPTCHA on Auth Forms

**What it is:** Bot protection on public forms using Cloudflare Turnstile, a privacy-friendly alternative to reCAPTCHA.

**When you need it:** When you see bot signups, credential stuffing, or spam on your registration/login forms.

**How to add it:**

### Install

```bash
npm install @marsidev/react-turnstile
```

### Client component (`src/components/turnstile.tsx`)

```tsx
'use client';

import { Turnstile } from '@marsidev/react-turnstile';

export function CaptchaWidget({
  onSuccess,
}: {
  onSuccess: (token: string) => void;
}) {
  return (
    <Turnstile
      siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
      onSuccess={onSuccess}
    />
  );
}
```

### Integration in the register form

```tsx
'use client';

import { useState } from 'react';
import { CaptchaWidget } from '@/components/turnstile';

export default function RegisterPage() {
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    if (!captchaToken) return;
    formData.append('captcha_token', captchaToken);
    // submit to your API route
  }

  return (
    <form action={handleSubmit}>
      {/* email, password fields */}
      <CaptchaWidget onSuccess={setCaptchaToken} />
      <button type="submit" disabled={!captchaToken}>
        Register
      </button>
    </form>
  );
}
```

### Server-side verification (`src/app/api/admin/register/route.ts`)

```ts
async function verifyCaptcha(token: string): Promise<boolean> {
  const response = await fetch(
    'https://challenges.cloudflare.com/turnstile/v0/siteverify',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: process.env.TURNSTILE_SECRET_KEY,
        response: token,
      }),
    },
  );
  const data = await response.json();
  return data.success === true;
}
```

### Env vars

```
NEXT_PUBLIC_TURNSTILE_SITE_KEY=0x4AAAAAAA...
TURNSTILE_SECRET_KEY=0x4AAAAAAA...
```

---

## 11. Email Verification

**What it is:** Requiring users to confirm their email address before they can access the app, using Supabase Auth's built-in email confirmation flow.

**When you need it:** When you need verified email addresses before granting access (regulatory, trust, or spam prevention).

**How to add it:**

### 1. Enable in Supabase config (`supabase/config.toml`)

```toml
[auth]
enable_signup = true

[auth.email]
enable_confirmations = true
double_confirm_changes = true
```

For self-hosted (Docker), set the environment variable:

```yaml
# docker-compose.yml, under gotrue service:
GOTRUE_MAILER_AUTOCONFIRM: "false"
```

### 2. Update middleware to check confirmation

Add to `src/middleware.ts` inside the `isAdminRoute && user` block:

```ts
if (isAdminRoute && user) {
  // Block unconfirmed users
  if (!user.email_confirmed_at) {
    return NextResponse.redirect(new URL('/verify-email', request.url));
  }
  // ... existing role check
}
```

### 3. Verification pending page (`src/app/(auth)/verify-email/page.tsx`)

```tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function VerifyEmailPage() {
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Check your email</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          We sent a confirmation link to your email address.
          Click the link to verify your account and get started.
        </p>
      </CardContent>
    </Card>
  );
}
```

### 4. Handle the confirmation callback

Supabase redirects users to your `SITE_URL` with a token. Add a route to handle this (`src/app/api/auth/confirm/route.ts`):

```ts
import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type');

  if (token_hash && type) {
    const supabase = createServerClient(
      process.env.SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return request.cookies.getAll(); },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              request.cookies.set(name, value),
            );
          },
        },
      },
    );

    await supabase.auth.verifyOtp({ token_hash, type: type as 'email' });
  }

  return NextResponse.redirect(new URL('/admin', request.url));
}
```

Update the matcher in `src/middleware.ts` to include the new routes:

```ts
export const config = {
  matcher: [
    '/admin/:path*',
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/verify-email',
  ],
};
```
