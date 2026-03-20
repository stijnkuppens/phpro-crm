# External Integrations

**Analysis Date:** 2026-03-20

## APIs & External Services

**Supabase (Primary):**
- Full backend platform with database, auth, real-time, storage
  - SDK/Client: `@supabase/supabase-js` 2.99.1, `@supabase/ssr` 0.9.0
  - Auth: Environment variables (JWT tokens, ANON_KEY, SERVICE_ROLE_KEY)
  - Kong Gateway: Reverse proxy at port 8000 (local) forwarding to PostgREST, auth, realtime, storage

**None detected** - No third-party APIs (Stripe, SendGrid, Slack, external analytics) are currently integrated.

## Data Storage

**Databases:**
- PostgreSQL 15.8.1 (self-hosted via Docker)
  - Connection: Environment variables `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_DB`, `POSTGRES_PASSWORD`
  - Client: @supabase/supabase-js (uses PostgREST HTTP API, not direct connection)
  - Type generation: `supabase gen types typescript` → auto-generated `src/types/database.ts`

**File Storage:**
- Supabase Storage (local file backend in Docker)
  - Storage API service via Kong gateway
  - Bucket: `stub` (configured via `GLOBAL_S3_BUCKET` env var)
  - Backend: `STORAGE_BACKEND: file` (local filesystem in `docker/supabase/volumes/storage/`)
  - File size limit: 50MB (`FILE_SIZE_LIMIT: 52428800`)
  - Image transformation: ImgProxy (v3.8.0) for WebP detection and image proxying

**Caching:**
- None detected (no Redis, Memcached, or application-level cache configured)

## Authentication & Identity

**Auth Provider:**
- Supabase GoTrue (self-hosted via Docker)
  - Implementation: `@supabase/ssr` with cookie-based auth (server components and browser client)
  - Server client: `createServerClient()` in `src/lib/supabase/server.ts` (manages auth cookies)
  - Browser client: `createBrowserClient()` in `src/lib/supabase/client.ts` (singleton WebSocket connection)
  - Admin client: `createServiceRoleClient()` in `src/lib/supabase/admin.ts` (bypasses RLS, for audit/admin operations)
  - User roles: `admin`, `sales_manager`, `sales_rep`, `customer_success`, `marketing` (stored in `user_profiles.role`)
  - Configuration: Email auth enabled, SMTP via Inbucket (test mailbox), auto-confirm enabled in dev
  - JWT secret, expiration, and ANON_KEY managed via environment variables

**Authorization:**
- Row-Level Security (RLS) policies defined in migrations (`supabase/migrations/`)
- Role-based access control enforced via RLS and `user_profiles.role`
- Permission helper: `src/lib/require-permission.ts` for server-side checks

## Monitoring & Observability

**Error Tracking:**
- None detected (no Sentry, Honeycomb, or external error tracking service)

**Logs:**
- Docker Compose stdout (no centralized logging service detected)
- Supabase Studio dashboard (port 3001) for database and auth logs
- Client-side: Console logging only (no structured logging library)

## CI/CD & Deployment

**Hosting:**
- Self-hosted (Docker Compose)
  - Database: `db` container (PostgreSQL 15.8)
  - API Gateway: `kong` container (API routing)
  - Studio: Supabase Studio (port 3001, for database management)
- Production deployment: Standalone Next.js Docker build with external Supabase URL

**CI Pipeline:**
- Not detected (no GitHub Actions, GitLab CI, or similar configuration in repository)

## Environment Configuration

**Required env vars (client-side):**
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase API base URL (http://localhost:8000 locally)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Anonymous JWT key (public, for browser)

**Required env vars (server-side):**
- `SUPABASE_URL` - Supabase server URL (same as public URL)
- `SUPABASE_SERVICE_ROLE_KEY` - Full access JWT key (secrets, never exposed to browser)
- `WEBHOOK_SECRET` - HMAC secret for webhook signature verification (optional)

**Docker/Database setup vars:**
- `PROJECT_NAME` - Docker project namespace
- `KONG_HTTP_PORT`, `POSTGRES_EXPOSED_PORT`, `STUDIO_PORT` - Port mappings
- `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_DB`, `POSTGRES_PASSWORD` - DB credentials
- `JWT_SECRET`, `JWT_EXP` - JWT configuration
- `ANON_KEY`, `SERVICE_ROLE_KEY` - JWT keys (generated in .env)
- `SITE_URL` - Application URL for redirects (http://localhost:3000)
- `GOTRUE_SMTP_HOST`, `GOTRUE_SMTP_PORT`, `GOTRUE_SMTP_SENDER_NAME` - Email configuration
- `STORAGE_BACKEND`, `GLOBAL_S3_BUCKET`, `REGION` - File storage config
- `SECRET_KEY_BASE`, `VAULT_ENC_KEY`, `PG_META_CRYPTO_KEY`, `LOGFLARE_API_KEY` - Supabase internal keys

**Secrets location:**
- `.env` file (git-ignored, created from `.env.example`)
- For production: environment variables injected at container runtime

## Webhooks & Callbacks

**Incoming:**
- `POST /api/webhooks` (`src/app/api/webhooks/route.ts`)
  - Signature verification: HMAC-SHA256 via `WEBHOOK_SECRET`
  - Headers: `x-webhook-signature` (required, timing-safe comparison)
  - Body: JSON payload (no specific schema defined yet)
  - Currently logs payload, no business logic implemented

**Outgoing:**
- None detected (no integration with external services that would require callback URLs)

## Real-Time Subscriptions

**Supabase Realtime:**
- WebSocket connection managed by browser client (`createBrowserClient()`)
- Used via `useRealtime` hook in client components
- Filter support: PostgREST filter syntax for scoping subscriptions (e.g., `user_id=eq.${userId}`)
- Supports: INSERT, UPDATE, DELETE events
- Implementation: `@supabase/supabase-js` `onPostgresChanges()`

## Security Configuration

**CSP (Content Security Policy):**
- `default-src 'self'` - Restrict to same origin
- `script-src 'self' 'unsafe-inline' 'unsafe-eval'` - Allow Next.js inline scripts (development convenience)
- `style-src 'self' 'unsafe-inline'` - Allow Tailwind inline styles
- `img-src 'self' blob: data: ${NEXT_PUBLIC_SUPABASE_URL}` - Images from Supabase storage
- `font-src 'self' fonts.gstatic.com` - Google Fonts
- `connect-src 'self' ${NEXT_PUBLIC_SUPABASE_URL} wss://*` - Supabase API + WebSocket real-time
- `frame-ancestors 'none'` - Prevent embedding in iframes

**Additional Headers:**
- `X-Frame-Options: DENY` - No framing
- `X-Content-Type-Options: nosniff` - Prevent MIME sniffing
- `Strict-Transport-Security: max-age=63072000; includeSubDomains` - HTTPS enforcement (2 years)
- `Referrer-Policy: strict-origin-when-cross-origin` - Restrict referrer leakage
- `Permissions-Policy: camera=(), microphone=(), geolocation=()` - Disable device access

---

*Integration audit: 2026-03-20*
