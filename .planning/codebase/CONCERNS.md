# Codebase Concerns

**Analysis Date:** 2026-03-20

## Tech Debt

**Plate Editor Deprecation:**
- Issue: `@udecode/plate` v49.0.0 is deprecated; package moved to `@platejs/core`
- Files: `src/components/admin/rich-text-editor.tsx`
- Impact: The rich-text-editor is a textarea stub with TODO comment. Upgrading will require migrating to new package names and API
- Fix approach: When implementing real Plate integration, migrate to `@platejs/core` and update component implementation

**TypeScript Type Safety - Dynamic Table Queries:**
- Issue: Supabase queries with dynamic table names require `as any` casts to work around TypeScript's union type limitations
- Files: `src/lib/hooks/use-entity.ts`, `src/features/accounts/actions/manage-account-relations.ts`, `src/features/people/actions/manage-hr-records.ts`
- Impact: Loses type safety for `.insert()`, `.update()`, `.delete()` operations on dynamic tables
- Fix approach: Create strongly-typed wrapper functions for each table's mutations, or wait for better TypeScript support for Supabase client

**Explicit Any Types in UI Components:**
- Issue: Generic `Record<string, any>` used throughout for flexibility, but sacrifices type safety
- Files: `src/components/admin/data-table.tsx` (line 57), `src/lib/hooks/use-entity.ts` (lines 26-28), `src/components/admin/entity-form.tsx`
- Impact: No compile-time checks for valid data shapes; errors caught only at runtime
- Fix approach: Create entity-specific types instead of `any`, or use `satisfies` operator for partial type checking

**Console-Based Error Logging:**
- Issue: Query failures logged to console with `console.error()` rather than structured logging or observability
- Files: 20+ query files including `src/features/auth/queries/`, `src/features/deals/queries/`, `src/features/contacts/queries/`
- Impact: Errors invisible in production; no centralized error tracking
- Fix approach: Create `logError()` utility using structured logger (Sentry, LogRocket, etc.); replace all `console.error()` calls

## Known Bugs

**Missing Error Boundaries on Routes:**
- Symptoms: Routes without `error.tsx` will show default Next.js error UI instead of branded error page
- Files: `src/app/admin/pipeline/`, `src/app/admin/materials/`, `src/app/admin/people/`, `src/app/admin/people/[id]/`, `src/app/admin/prognose/`, `src/app/admin/revenue/`, `src/app/admin/accounts/[id]/`, `src/app/admin/contacts/[id]/`, `src/app/admin/accounts/new/`, `src/app/admin/users/[id]/`, `src/app/admin/users/invite/`
- Trigger: Any error thrown or unhandled rejection in these routes' server components
- Workaround: Add `error.tsx` files to all admin routes following parent's pattern

**Thrown Errors in Query Functions:**
- Symptoms: `get-user.ts` and `get-files.ts` throw errors instead of returning null/empty arrays
- Files: `src/features/users/queries/get-user.ts`, `src/features/files/queries/get-files.ts`
- Trigger: Any database error in these two queries will crash the calling component
- Workaround: Wrap calls in try-catch or update these queries to match error-handling pattern used elsewhere

**Try-Catch Mismatch:**
- Issue: Only 1 catch block in codebase (90 try blocks) - inconsistent error handling approach
- Files: Scattered across `src/features/`, most queries use `if (error) return []` pattern instead
- Impact: Some errors silently fail with empty data, others might throw
- Fix approach: Standardize on `if (error) return fallback` pattern everywhere; remove orphaned try-catch blocks

## Security Considerations

**Row-Level Security (RLS) Gaps:**
- Risk: Recent migration `00053_add_missing_fk_constraints.sql` suggests RLS policies may not cover all table relationships
- Files: `supabase/migrations/00053_add_missing_fk_constraints.sql` added FK constraints retroactively
- Current mitigation: Migrations include `GRANT` statements and policies, but FK constraints were missing
- Recommendations:
  - Audit all tables in `supabase/migrations/` for RLS policy coverage
  - Verify every foreign key has corresponding RLS policy
  - Add RLS policy tests before allowing user-initiated updates to related records

**Proxy.ts Route Permissions Coverage:**
- Risk: `src/proxy.ts` defines `routePermissions` list manually; easy to miss new routes
- Files: `src/proxy.ts` (lines 7-25)
- Current mitigation: Permission check catches unmapped routes and redirects to `/admin` (non-breaking)
- Recommendations:
  - Generate route permissions from filesystem structure (routes → required permissions)
  - Add tests verifying every `/admin/*` route has a corresponding permission entry
  - Update proxy.ts when adding new admin routes (create checklist or generator)

**Dynamic Table Updates Without Per-Table RLS:**
- Risk: `manage-account-relations.ts` uses dynamic table name with generic RLS policy
- Files: `src/features/accounts/actions/manage-account-relations.ts` (lines 14-110)
- Current mitigation: Server action enforces permission check before mutation
- Recommendations:
  - Verify each table in `manage-account-relations` has row-level RLS enabled
  - Test that users can only modify related records tied to accounts they own

## Performance Bottlenecks

**Large Form Component (767 lines):**
- Problem: `account-form.tsx` is 767 lines with many state updates and nested forms
- Files: `src/features/accounts/components/account-form.tsx`
- Cause: Multiple chips inputs (Samenwerkingsvormen, Tech Stack, Manual Services), competence centers table, hosting table, all in one component
- Improvement path:
  - Extract ChipInput to standalone component
  - Extract CompetenceCenters subsection to `<CompetenceCentersList>` component
  - Extract Hosting subsection to `<HostingList>` component
  - Memoize subsections with `React.memo()` to prevent re-renders on parent form changes

**Missing useCallback/useMemo Optimizations:**
- Problem: 38 instances of useCallback/useMemo but many event handlers defined inline
- Files: `src/features/accounts/components/account-form.tsx` (add/remove handlers), `src/features/files/` components
- Cause: Form handlers defined inline in render, recreated on every render
- Improvement path:
  - Wrap `add()` and `remove()` in ChipInput with useCallback
  - Memoize filtered suggestions list with useMemo
  - Apply same pattern to FolderTree, FileDetailPanel handlers

**DataTable Pagination State Management:**
- Problem: Client-side pagination forces re-fetch on every page change, even for cached data
- Files: `src/components/admin/data-table.tsx` (lines 42-48)
- Cause: `useEntity` hook doesn't cache pages; each `onPageChange` triggers server query
- Improvement path:
  - Consider adding in-memory page cache (Map<pageNumber, results>)
  - Use TanStack Query or similar for automatic caching if pagination becomes frequent

## Fragile Areas

**Account Form Relation Sync (Promise.all chains):**
- Files: `src/features/accounts/components/account-form.tsx` (lines 390-441)
- Why fragile:
  - Multiple sequential Promise.all() chains (techStacks → samenwerkingsvormen → hosting → competenceCenters)
  - If one batch fails, others may have already succeeded, leaving data inconsistent
  - No rollback mechanism
- Safe modification:
  - Wrap entire sync sequence in try-catch
  - Store intermediate results
  - On error, log failure and ask user to retry (don't silently fail)
  - Consider database triggers to auto-clean orphaned relations
- Test coverage: No tests for partial failure scenarios

**useEntity Hook - Cancellation Flag Incomplete:**
- Files: `src/lib/hooks/use-entity.ts` (lines 33-78)
- Why fragile:
  - Hook fetches data but never uses cancellation flag (code pattern mentioned in CLAUDE.md but not implemented)
  - If component unmounts during fetch, stale update will occur
  - Race conditions possible if user rapidly changes pages
- Safe modification:
  - Add `cancelled` flag and check before `setData()` updates
  - See CLAUDE.md async effect cleanup pattern
  - Test by navigating away during slow network
- Test coverage: None visible

**File Upload Validation - Size/MIME Checked Client-Side Only:**
- Files: `src/lib/hooks/use-file-upload.ts` (lines 49-164), `src/components/admin/file-upload.tsx`
- Why fragile:
  - Client-side validation can be bypassed (disable JS, use API directly)
  - Server doesn't re-validate MIME type or size before storing
- Safe modification:
  - Add server-side validation in upload action
  - Check Content-Type header on PUT to Supabase Storage
  - Verify file size against bucket policies
- Test coverage: None visible

## Scaling Limits

**Database Type Generation:**
- Current capacity: Manually sync `src/types/database.ts` after migrations (error-prone)
- Limit: As more tables are added (already 40+ types), manual updates break easily
- Scaling path:
  - Fix `task types:generate` by adjusting Supabase CLI to work with Docker Compose stack
  - OR generate types from migration files programmatically
  - Add CI check to verify types match current schema

**List Component Pagination (default 10 items):**
- Current capacity: 10-item pages with client-side search (works for <5000 records)
- Limit: If any single entity grows to >100k records, pagination becomes slow
- Scaling path:
  - Add cursor-based pagination as alternative to offset-based
  - Implement infinite scroll for large datasets
  - Consider full-text search if searchability becomes bottleneck

## Dependencies at Risk

**Deprecated Plate Editor Package:**
- Risk: `@udecode/plate@49.0.0` no longer maintained
- Impact: No security updates, incompatible with future TypeScript versions
- Migration plan: Migrate to `@platejs/core` and `@platejs/react` before Next.js version bump

**Outdated next-intl (v4.8.3):**
- Risk: Version is several months old; newer versions may have breaking changes
- Impact: Locale routing might diverge from upstream (e.g., new locale formats)
- Migration plan: Test upgrade path to v5.x in non-production environment first

## Missing Critical Features

**No Structured Error Handling in Client Components:**
- Problem: Forms show toast on error but don't validate that errors are actually readable messages
- Blocks: User guidance during failures (e.g., "API temporarily down" vs. "Invalid input")
- Recommendation: Create `ErrorFormatter` utility to turn `ActionResult<T>` errors into user-friendly messages

**No Audit Log Viewer UI:**
- Problem: `audit_logs` table is populated but no `/admin/audit` detail view exists
- Blocks: Users can't investigate who did what; only exists skeleton page
- Recommendation: Build audit detail page with filters (user, entity type, date range) and metadata viewer

## Test Coverage Gaps

**Server Actions (120 total):**
- What's not tested: No unit tests visible for any server action (create-account, update-contact, etc.)
- Files: All `src/features/*/actions/*.ts` files
- Risk: Validation logic uncaught until production; mutations may fail silently
- Priority: High - implement test suite for all create/update/delete actions

**useEntity Hook Behavior:**
- What's not tested: Pagination edge cases, cancellation behavior, error handling
- Files: `src/lib/hooks/use-entity.ts`
- Risk: Stale updates, race conditions on rapid navigation
- Priority: High - test unmount during fetch, rapid page changes

**File Upload Restrictions:**
- What's not tested: MIME type validation, size limits, invalid file handling
- Files: `src/lib/hooks/use-file-upload.ts`, `src/components/admin/file-upload.tsx`
- Risk: Malicious files uploaded (bypassing client-side check)
- Priority: Medium - add server-side validation tests

**Account Relations Sync:**
- What's not tested: Partial failures in Promise.all chains, consistency after errors
- Files: `src/features/accounts/components/account-form.tsx`, `src/features/accounts/actions/manage-account-relations.ts`
- Risk: Data inconsistency if one batch fails
- Priority: Medium - test rollback scenarios

**RLS Policies:**
- What's not tested: No visible integration tests for RLS enforcement
- Files: All migrations with `ENABLE ROW LEVEL SECURITY`
- Risk: Permission bypass if policy logic has bugs
- Priority: Critical - implement RLS policy tests in CI/CD

---

*Concerns audit: 2026-03-20*
