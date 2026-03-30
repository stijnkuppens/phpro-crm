# Codebase Audit: PHPro CRM

**Date:** 2026-03-30
**Stack:** TypeScript 5.9.3 / Next.js 16.2.1 / React 19 / PostgreSQL via Supabase / Docker Compose
**Architecture:** Feature-driven monolith, App Router, ~415 files, ~38.3 KLOC, 17 feature domains

---

## Executive Summary

PHPro CRM is a well-structured internal admin application with strong architectural foundations. The feature-module pattern is followed with exceptional consistency: 100% of server actions use the `ActionResult<T>` pattern, 100% of queries use `React.cache()`, and TypeScript strict mode is enforced with zero `@ts-ignore` directives. Security is solid across all layers — 230 RLS policies, Zod validation on all inputs, route-level auth via `proxy.ts`, and permission guards on every server action. The primary areas for improvement are operational maturity (no error tracking service, no request correlation) and hardening CSP by replacing `unsafe-inline` with nonce-based scripts.

**Final Score: 7.5 / 10**

*Note: Testing and API Documentation dimensions were excluded from this audit at the user's request. Weights have been redistributed proportionally.*

---

## Security

**Rating: 8 / 10**

Strong defense-in-depth at the database, middleware, and application layers. Comprehensive RLS (230 policies), Zod validation on all inputs, route-level auth via `proxy.ts`, and permission guards on every server action. The main gaps are CSP weakened by `unsafe-inline` and no rate limiting.

### Findings

#### Critical
| # | Finding | Location | Evidence |
|---|---------|----------|----------|
| S1 | CSP allows `script-src 'unsafe-inline'` in production | `next.config.ts:43` | `script-src 'self' 'unsafe-inline'` set for all environments. Significantly weakens XSS protection. Next.js supports nonce-based CSP as an alternative. |

#### High
| # | Finding | Location | Evidence |
|---|---------|----------|----------|
| S2 | No rate limiting on any endpoint | Entire codebase | Zero rate limiting configuration. The `/api/admin/invite` route triggers emails and is particularly sensitive. No references to rateLimit, throttle, or similar. |
| S3 | Storage avatar INSERT policy lacks user scoping | `supabase/migrations/00013_storage_avatar_prefixes.sql:9-19` | Policy only checks folder prefix (`accounts/`, `contacts/`, etc.) but not `auth.uid()`. Any authenticated user can upload/overwrite avatars for any entity. |

#### Medium
| # | Finding | Location | Evidence |
|---|---------|----------|----------|
| S4 | 3 server actions throw on auth failure | `src/features/jobs/actions/retry-job.ts:10`, `delete-job.ts:11`, `create-export-job.ts:30` | `requirePermission()` called outside try-catch. Auth failures propagate as unhandled exceptions instead of `err()`, violating the project's own convention. |
| S5 | `FUNCTIONS_VERIFY_JWT=false` in `.env.example` | `.env.example:170` | Default disables JWT verification for Edge Functions. Any future function would be publicly callable without auth. |
| S6 | 6 account sub-tab pages missing `notFound()` guard | `src/app/admin/accounts/[id]/activiteiten/page.tsx` + 5 others | Parent layout checks, but direct access after stale layout cache could render broken pages. |
| S7 | `connect-src` in CSP broadly allows `ws: wss:` | `next.config.ts:47` | WebSocket connections allowed to any origin. Should be scoped to Supabase domain. |

#### Low
| # | Finding | Location | Evidence |
|---|---------|----------|----------|
| S8 | `markAsRead` action bypasses ACL layer | `src/features/notifications/actions/mark-as-read.ts:7-26` | Uses `auth.getUser()` directly instead of `requirePermission()`. Query-scoped to `user_id` so cross-user access prevented, but inconsistent with other actions. |
| S9 | File upload validates client-reported MIME type only | `src/lib/hooks/use-file-upload.ts:43` | `file.type` is browser-reported, not verified by magic bytes. No server-side content validation. |
| S10 | Health endpoint uses service role client | `src/app/api/health/route.ts:6-7` | `createServiceRoleClient()` for a simple health probe bypasses RLS unnecessarily. |

### What Works Well

- Route-level auth enforcement via `proxy.ts` (Next.js 16 middleware) with role-based route protection
- 100% RLS coverage: 56 tables, 230 policies, explicit GRANT statements on every table
- 49/51 server actions use `requirePermission()` with typed ACL permissions
- Defense-in-depth: audit_logs and notifications use `REVOKE INSERT FROM authenticated`
- Database trigger `prevent_role_change` prevents role escalation
- SECURITY DEFINER functions all set `search_path = public`
- SQL injection prevention: `sync_account_fk_relation` validates table names against allowlist
- Webhook HMAC verification with `crypto.timingSafeEqual`
- Open redirect prevention in auth callback
- `escapeSearch()` escapes PostgREST ilike metacharacters
- Zod validation on every server action with user input
- Cookie-based auth via `@supabase/ssr` with httpOnly cookies
- Env validation with Zod at startup
- Comprehensive security headers: HSTS (2yr + preload), X-Frame-Options DENY, X-Content-Type-Options nosniff

---

## Architecture

**Rating: 8 / 10**

Exceptionally consistent feature-module structure across all 17 domains. The server-first data flow pattern is followed religiously. The main gaps are the unwired middleware, oversized components, and some cross-feature coupling.

### Findings

#### High
| # | Finding | Location | Evidence |
|---|---------|----------|----------|
| A1 | 7 account sub-tab pages missing `notFound()` guard | `src/app/admin/accounts/[id]/activiteiten/page.tsx` + 6 others | Parent layout checks, but pages violate the stated architecture rule requiring `notFound()` in detail server components. |

#### Medium
| # | Finding | Location | Evidence |
|---|---------|----------|----------|
| A2 | Zero Suspense boundaries | `src/app/` | No `<Suspense>` in any page/layout. Pages with multiple data sources block on the slowest query instead of streaming sections independently. |
| A3 | 7 components exceed 400 lines | `link-consultant-wizard.tsx` (812), `indexation-wizard.tsx` (762), `deal-detail.tsx` (529), `contract-edit-page.tsx` (521), `consultant-list.tsx` (497), `consultant-detail-modal.tsx` (494), `data-table.tsx` (572) | Guideline is ~150 lines max. Candidates for extraction. |
| A4 | Cross-feature coupling: contracts imports indexation internals | `src/features/contracts/components/contract-edit-page.tsx:30` + 3 others | Direct internal imports between feature modules rather than shared interfaces. |
| A5 | 2 routes missing loading.tsx | `src/app/admin/settings/account/`, `src/app/admin/users/[id]/edit/` | Violates stated requirement for page.tsx + loading.tsx + error.tsx on every route. |

#### Low
| # | Finding | Location | Evidence |
|---|---------|----------|----------|
| A6 | `generateMetadata` on only 5 of ~36 pages | Various | Browser tabs show generic titles. Low impact for internal CRM. |

### What Works Well

- Route-level auth + role-based route protection via `proxy.ts` (Next.js 16 middleware pattern)
- All 17 features follow exact same `actions/ | queries/ | components/ | types.ts | columns.tsx` structure
- 100% React.cache() on all 42 query files
- 100% ActionResult + requirePermission on all 50 server actions
- All 36 admin page files are async server components with zero `'use client'`
- 14 pages pass `initialData`/`initialCount` to eliminate client-side waterfalls
- `Promise.all()` used in 19 page/layout files for concurrent data loading
- 28 error.tsx files + global-error.tsx + not-found.tsx
- Clean 5-role ACL model, no barrel files anywhere
- Route groups for auth/public layout sharing

---

## Code Quality

**Rating: 7 / 10**

TypeScript strict mode with zero escape hatches is exemplary. The ActionResult and React 19 form patterns are followed with perfect consistency. The main concerns are boilerplate duplication, oversized components, and inconsistent error message language.

### Findings

#### High
| # | Finding | Location | Evidence |
|---|---------|----------|----------|
| CQ1 | Dead code: `database.types.ts` (3196 lines) | `src/lib/supabase/database.types.ts` | Never imported. All Supabase clients import from `@/types/database` instead. |
| CQ2 | 59 parameterless `catch {}` blocks discard error context | 52 action files | `catch {` with no variable. Original exception (Supabase outage vs. permission denial) never logged. Only `send-communication-email.ts:31` captures the error. |
| CQ3 | 4 unused production dependencies | `package.json` | `react-hook-form`, `@hookform/resolvers`, `recharts`, `react-image-crop` — zero imports in `src/`. |

#### Medium
| # | Finding | Location | Evidence |
|---|---------|----------|----------|
| CQ4 | Mixed Dutch/English error messages | `src/features/deals/actions/move-deal-stage.ts:27-28`, `close-deal.ts`, others | Most errors Dutch (`'Er is een fout opgetreden'`) but several English: `'Stage not found'`, `'Deal not found'`, `'Invalid deal ID'`. |
| CQ5 | 7 components exceed 500 lines | `link-consultant-wizard.tsx` (812), `indexation-wizard.tsx` (762), etc. | `indexation-wizard.tsx` has a single 730-line function with 9 `useState` calls. Strong candidate for `useReducer` extraction. |
| CQ6 | Zero Suspense boundaries | `src/app/` | Route-level `loading.tsx` exists (26 files) but no section-level streaming. |
| CQ7 | 6 Biome errors persisting | `notification-list.tsx:59`, `data-table.tsx`, `user-list.tsx` | Despite pre-commit hook. |

#### Low
| # | Finding | Location | Evidence |
|---|---------|----------|----------|
| CQ8 | 65 `biome-ignore` suppressions across 38 files | Various | Most justified (dynamic table names, skeleton keys). Zero `@ts-ignore`/`@ts-expect-error` — clean. |
| CQ9 | Permission-check boilerplate in 52 files | All action files | Identical 5-line pattern. A `withPermission` wrapper could reduce to 1 line per action. |

### What Works Well

- TypeScript strict mode with zero `@ts-ignore`/`@ts-expect-error`
- 100% ActionResult pattern adoption across 51 server actions
- Biome linter + formatter with pre-commit hook enforcement
- Zero `console.log` in production code (only 2 justified `console.error`)
- 36 components use `useActionState` — zero legacy `onSubmit` anti-pattern
- `'use client'` pushed to leaves (67% client, but server pages are thin wrappers)
- Zod schemas co-located in `types.ts` (12/14 features)
- No loose equality (`==`/`!=`) anywhere

---

## Performance

**Rating: 7 / 10**

Strong server-first data flow with consistent React.cache(), parallel fetching, and database indexing. Main gaps are SELECT * queries and missing Suspense boundaries for progressive loading.

### Findings

#### High
| # | Finding | Location | Evidence |
|---|---------|----------|----------|
| P1 | `SELECT *` in 9/39 query files | `get-hourly-rates.ts:12`, `get-users.ts:18`, `get-contacts-by-account.ts:12`, `get-job.ts:8`, `get-current-user.ts:23` + 4 others | Fetches all columns when subset needed. 30 queries use explicit selections, showing inconsistency. |
| P2 | `SELECT *` in ~20 mutation actions for audit snapshots | `stop-consultant.ts:33`, `close-deal.ts:31`, `delete-account.ts:22` + others | Before/after snapshots pull entire rows. Somewhat justified for audit completeness. |

#### Medium
| # | Finding | Location | Evidence |
|---|---------|----------|----------|
| P3 | No Suspense boundaries for progressive loading | `src/app/` | Zero `<Suspense>` usage. Dashboard and detail pages with multiple queries block on slowest. |
| P4 | `framer-motion` imported for single page transition | `src/components/layout/page-transition.tsx` | ~30KB gzipped for one component. Not loaded via `next/dynamic`. |
| P5 | `recharts` likely dead dependency | `package.json` | Zero imports found in `src/`. ~200KB gzipped if tree-shaking fails. |

#### Low
| # | Finding | Location | Evidence |
|---|---------|----------|----------|
| P6 | Sequential inserts in `saveIndexationDraft` | `src/features/indexation/actions/save-indexation-draft.ts:66-108` | 4 sequential DB operations could use `Promise.all` for independent inserts. |
| P7 | Notification bell client-side filtering | `src/features/notifications/components/notification-bell.tsx:26` | `.filter()` on array. Fine at current `.range(0, 24)` limit. |

### What Works Well

- 42/42 queries wrapped in `React.cache()` for per-request deduplication
- `Promise.all` in 29 files for parallel data fetching
- Supavisor connection pooler with transaction-mode pooling
- Browser Supabase client is singleton, service role client cached at module level
- 40+ database indexes covering FK columns, search columns (trigram), and sort columns
- `next/dynamic` for modals in 9 component files
- `count: 'exact', head: true` for dashboard count-only queries
- Bulk delete via `.in('id', ids)` — no per-record loops
- 26 `loading.tsx` + 28 `error.tsx` files
- `escapeSearch()` utility for safe ilike operators
- `output: 'standalone'` configured for Docker, no `ignoreBuildErrors`

---

## Logging & Observability

**Rating: 6 / 10**

Structured logging via Pino is well-adopted (107 calls across 86 files), and the audit trail for business events is comprehensive. However, the absence of an error tracking service and request correlation makes production debugging extremely difficult.

### Findings

#### Critical
| # | Finding | Location | Evidence |
|---|---------|----------|----------|
| L1 | No error tracking service | Entire codebase | No Sentry, Bugsnag, Datadog, or any external error tracking. Errors only logged to stdout via Pino. Zero error tracking dependencies in package.json. |
| L2 | No request correlation/tracing | Entire codebase | No request ID generation or propagation. Zero matches for `correlation`, `request-id`, `trace-id`. Cannot associate log entries with specific requests. |

#### High
| # | Finding | Location | Evidence |
|---|---------|----------|----------|
| L3 | No monitoring or alerting infrastructure | Entire codebase | No metrics, no Prometheus endpoint, no APM. Only Pino stdout output. |

#### Medium
| # | Finding | Location | Evidence |
|---|---------|----------|----------|
| L4 | 2 straggler `console.error` calls | `src/app/api/admin/invite/route.ts:57` | Should use Pino logger. `parse-error.ts:23` is justified (fallback). |
| L5 | Logger lacks default context fields | `src/lib/logger.ts` | No environment, service name, or version fields. Indistinguishable from other services in multi-container setup. |
| L6 | ~40 `catch {}` blocks silently discard exceptions | Multiple server actions | Permission check errors never logged. A network error is indistinguishable from an auth error. |

#### Low
| # | Finding | Location | Evidence |
|---|---------|----------|----------|
| L7 | No log rotation configuration | `src/lib/logger.ts` | Pino writes to stdout. Docker runtime handles this, but no log shipping configured. |

### What Works Well

- Structured JSON logging via Pino with configurable `LOG_LEVEL` env var
- Pretty-printing in dev via `pino-pretty`
- `instrumentation.ts` hooks into Next.js `onRequestError` with structured context
- Comprehensive audit trail: `logAction()` logs user ID, IP, entity type/ID, before/after diffs
- 107 `logger.*` calls across 86 files — consistent Pino adoption
- `parseError()` utility for safe, centralized error-to-message conversion

---

## Caching

**Rating: 7 / 10**

Per-request deduplication via React.cache() is perfect. The caching strategy is appropriate for an authenticated CRM (dynamic rendering, RLS-scoped queries). Main improvement areas are tag-based revalidation and an external cache for expensive aggregations.

### Findings

#### Medium
| # | Finding | Location | Evidence |
|---|---------|----------|----------|
| C1 | No external cache layer (Redis/Memcached) | Entire codebase | Every page load re-queries the database. Dashboard stats and aggregations computed fresh per request. No `redis`, `ioredis`, `lru-cache` in deps. |
| C2 | `revalidatePath` is the only invalidation strategy | 48/51 action files | No `revalidateTag` usage. Mutations invalidate entire route trees rather than specific data dependencies. |
| C3 | No `export const revalidate` or `dynamic` on any page | `src/app/` | All pages rely on default dynamic behavior. No route segment config for caching control. |
| C4 | Health endpoint missing `Cache-Control` header | `src/app/api/health/route.ts:9` | Should set `Cache-Control: no-store` to prevent stale caching by load balancers. |

#### Low
| # | Finding | Location | Evidence |
|---|---------|----------|----------|
| C5 | Avatar URL cache unbounded | `src/components/admin/avatar.tsx:7` | Module-level `Map` grows without size limit. Only cleans expired entries on access. |
| C6 | No cache warming after deployment | Docker config | First request to each page hits cold cache. |

### What Works Well

- 100% React.cache() coverage on all 42 query files
- 48/51 actions properly call `revalidatePath()` after mutations
- API routes explicitly set `Cache-Control: no-store` on all response paths
- Smart avatar URL caching with TTL (~58 min) for Supabase signed URLs
- Appropriate strategy: dynamic rendering + RLS makes cross-user caching impossible, so per-request deduplication is the correct pattern

---

## Dependencies

**Rating: 7 / 10**

Clean dependency management with proper lock file, no wildcard versions, and good separation of prod/dev deps. Main concerns are unused dependencies and lack of automated update tooling.

### Findings

#### High
| # | Finding | Location | Evidence |
|---|---------|----------|----------|
| D1 | 4 unused production dependencies | `package.json` | `react-hook-form` (v7.71.2), `@hookform/resolvers` (v5.2.2), `recharts` (v2.15.4, ~400KB), `react-image-crop` (v11.0.10) — zero imports in `src/`. |
| D2 | No automated dependency update tooling | Project root | No `dependabot.yml`, `renovate.json`, or equivalent. Updates entirely manual. |
| D3 | No vulnerability scanning in CI | `.github/workflows/ci.yml` | Runs lint, format, type-check, build but never `npm audit`. 2 HIGH vulnerabilities would not block deployment. |

#### Medium
| # | Finding | Location | Evidence |
|---|---------|----------|----------|
| D4 | `@dnd-kit/utilities` unused | `package.json` | Listed as dependency but never imported. Only `@dnd-kit/core` is used. |
| D5 | `lucide-react` major version behind | `package.json` | v0.577.0 → v1.7.0 available. Major bump affects tree-shaking and imports. |
| D6 | `@supabase/ssr` minor version behind | `package.json` | v0.9.0 → v0.10.0. Pre-1.0 minor bumps can contain breaking changes. |

#### Low
| # | Finding | Location | Evidence |
|---|---------|----------|----------|
| D7 | `react-is` override is fragile | `package.json:51-53` | `"react-is": "$react"` works but could break silently if APIs diverge. |

### What Works Well

- Lock file committed and recently updated
- Clean `dependencies` vs `devDependencies` separation
- No wildcard or unbounded version ranges
- No `--legacy-peer-deps` or `--force` in CI
- Lean: 30 direct prod deps for a full-featured CRM
- CI uses `npm ci` for deterministic installs
- No postinstall scripts

---

## Code Origin Analysis

### Identical Permission-Check Boilerplate Across 51 Server Actions

Every server action file follows an identical try-catch pattern for permission checks. Files like `create-account.ts`, `create-contact.ts`, `create-activity.ts`, and 48 others all contain the same 5-line `try { await requirePermission(...) } catch { return err('Onvoldoende rechten') }` block with only permission names changing. This represents a cross-cutting concern that could be abstracted into a higher-order function.

### Duplicate Database Error Handling Across 42 Files

Approximately 42 action files contain identical error handling: `if (error) { logger.error({ err: error }, '[actionName] database error'); return err('Er is een fout opgetreden'); }` with only function names varying. The error message text is identical across all files.

### Correct Syntax But Missing Operational Infrastructure

The codebase compiles cleanly, types are correct, and linting passes. Route-level auth is properly handled via `proxy.ts`. However, other operational concerns are absent: no rate limiting, no request correlation IDs, and no error tracking service integration.

### Hand-Rolled HTTP Client for Supabase Settings

`src/features/auth/queries/get-oauth-providers.ts:34-39` makes a raw `fetch()` call to `${env.SUPABASE_URL}/auth/v1/settings` despite `@supabase/supabase-js` being installed. This is the only instance of direct HTTP fetching, indicating inconsistency in SDK usage.

---

## Summary Ratings

| Area | Effective Weight | Rating | Weighted |
|------|-----------------|--------|----------|
| Security | 30.1% | 8 / 10 | 2.41 |
| Architecture | 24.1% | 8 / 10 | 1.93 |
| Code Quality | 18.1% | 7 / 10 | 1.27 |
| Performance | 12.0% | 7 / 10 | 0.84 |
| Logging & Observability | 6.0% | 6 / 10 | 0.36 |
| Caching | 6.0% | 7 / 10 | 0.42 |
| Dependencies | 3.6% | 7 / 10 | 0.25 |
| Testing | -- | *Skipped* | -- |
| API Documentation | -- | *Skipped* | -- |
| **Overall** | **100%** | | **7.5 / 10** |

Findings summary: **2 critical, 6 high, 18 medium, 10 low**

---

## Prioritized Recommendations

### Critical (fix immediately)

1. **Add error tracking service (Sentry recommended)** — Integrate with `instrumentation.ts` and Pino. Without this, production errors are invisible unless someone monitors log output.
2. **Add request correlation IDs** — Generate a request ID in middleware/instrumentation and propagate through Pino logger context. Essential for debugging concurrent request issues.

### High Priority

3. **Fix CSP `unsafe-inline`** — Implement nonce-based CSP for script-src. Next.js supports this via nonce generation in the proxy/middleware layer.
4. **Add rate limiting** — At minimum on `/api/admin/invite` (email-triggering) and auth-related endpoints. Consider `@upstash/ratelimit` or similar.
5. **Remove unused production dependencies** — `react-hook-form`, `@hookform/resolvers`, `recharts`, `react-image-crop`, `@dnd-kit/utilities`. Reduces bundle size and attack surface.
6. **Add `npm audit` to CI pipeline** — Block deployment on HIGH/CRITICAL vulnerabilities.
7. **Scope storage avatar policy to `auth.uid()`** — Prevent cross-user avatar overwrites.
8. **Fix 3 throwing server actions** — `retry-job.ts`, `delete-job.ts`, `create-export-job.ts` need try-catch around `requirePermission()`.

### Medium Priority

9. **Add Suspense boundaries** — Start with dashboard page for progressive loading of independent sections.
10. **Extract oversized components** — Prioritize `indexation-wizard.tsx` (812 lines, 9 useState) and `contract-edit-page.tsx` (521 lines, 9 useState) for `useReducer` extraction.
11. **Log permission check errors** — Change `catch {}` to `catch (e)` and log at warn level. Distinguish auth errors from infrastructure errors.
12. **Switch to `revalidateTag`** — More granular invalidation than `revalidatePath` for high-frequency mutations.
13. **Standardize error message language** — All user-facing messages should be Dutch (per convention).
14. **Remove dead code** — `src/lib/supabase/database.types.ts` (3196 unused lines).
15. **Add `Cache-Control: no-store` to health endpoint**.
16. **Replace `SELECT *` with explicit column selections** in the 9 query files.

### Low Priority

17. **Add Dependabot or Renovate** for automated dependency updates.
18. **Add default context fields to Pino** — service name, environment, version.
19. **Lazy-load `framer-motion`** via `next/dynamic` or evaluate if page transitions are worth 30KB.
20. **Abstract permission-check boilerplate** into a `withPermission()` wrapper.
21. **Add `generateMetadata` to remaining detail pages** for better browser tab titles.
22. **Bound the avatar URL cache** with a max-size eviction strategy.
