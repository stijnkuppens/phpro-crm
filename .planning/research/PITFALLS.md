# Pitfalls Research

**Domain:** CRM + Consultancy staffing platform — demo-to-production port (Vue in-memory -> Next.js + Supabase)
**Researched:** 2026-03-20
**Confidence:** HIGH — derived from direct code inspection of both demo_crm/src/App.tsx (5809 lines) and production codebase, plus CONCERNS.md audit

---

## Critical Pitfalls

### Pitfall 1: Revenue Data Is Hardcoded in Demo — No Schema Exists Yet

**What goes wrong:**
The demo's revenue page (`RevenuePage`, `RTForecastTab`) uses a constant `RT_INITIAL_DATA` — a deeply nested object keyed by `client.name -> division -> service -> year -> [monthly values]`. There is no revenue_entries table that maps to this structure. The production `revenue_entries` table exists for individual entries but the prognose feature's `PrognoseLine` type has no database backing — it lives only in component state (`useState()`).

**Why it happens:**
Demo data is initialized at runtime from a hardcoded object. When porting, it looks like "revenue already exists" because `src/features/revenue/` exists, but the prognose feature has no queries or actions — only a `types.ts` and a components folder with no server-side persistence.

**How to avoid:**
Before building any prognose or forecast UI, define and migrate the database schema for `prognose_lines` (client, division, service, year, action, custom_amount). Then write actions/queries. Never build the UI against `useState` with the plan to "connect later."

**Warning signs:**
- `src/features/prognose/` has no `queries/` or `actions/` directories
- Prognose page refreshes back to defaults on every visit
- `RTForecastTab` passes `revenueData={RT_INITIAL_DATA}` (hardcoded constant) instead of a database query result

**Phase to address:** Prognose/Analytics phase — must be the first thing done before any UI work in that domain

---

### Pitfall 2: Demo Uses `readAsDataURL` for Files — Production Needs Supabase Storage Paths

**What goes wrong:**
`PdfUploadField` in the demo calls `reader.readAsDataURL(file)` and stores the base64 data URL directly in state. The production app must store a Storage path/URL in the database and upload the binary to Supabase Storage. If a porting developer copies the pattern verbatim, base64 strings (often 500KB+) end up stored in Postgres text columns, bloating the database and breaking any meaningful file management.

**Why it happens:**
The demo never persists anything — base64 is sufficient for display-only. It looks like a working file upload. The pattern is visually identical to a real upload but functionally wrong for production.

**How to avoid:**
Any form field that accepts a PDF/document must use `useFileUpload` hook from `src/lib/hooks/use-file-upload.ts` and store the returned `path` string. The `framework_pdf_url` and `service_pdf_url` fields in `contracts/types.ts` correctly use `string | null` for the URL — follow that pattern for every new document field.

**Warning signs:**
- Form state contains a field ending in `_data` or `_file` that holds a long string
- Database column type is `text` but the value starts with `data:application/pdf;base64,`
- File upload works but "download" opens a data URL instead of a Storage URL

**Phase to address:** Any domain phase that introduces document/PDF fields (Contracts, HR/People)

---

### Pitfall 3: Indexation Simulator State Is Never Persisted — Draft Approval Has No Audit Trail

**What goes wrong:**
The demo's 4-step indexation wizard (`IndexationSimulator`) stores draft state entirely in `useState`. Step transitions (simulate -> draft -> negotiate -> approve) are UI state. When porting, developers may implement the wizard correctly but forget that "approve" must write a permanent record — a new `hourly_rates` row for the next year and an `indexation_history` entry. If the approval step only calls `revalidatePath()` without inserting new rate rows, the indexation is visually confirmed but produces no effect on future tariff lookups.

**Why it happens:**
In the demo, "approve" calls `setContract()` on the parent, mutating in-memory state. There is no distinction between "save draft" and "apply approved rates." The production equivalent requires explicit DB writes to two separate tables.

**How to avoid:**
The approve action must: (1) insert a new `hourly_rates` row for the target year, (2) insert new `sla_rates` + `sla_tools` rows for the target year, (3) insert an `indexation_history` entry with the approval metadata. Verify by querying `hourly_rates` after approval and confirming a new row exists for `year = current_year + 1`.

**Warning signs:**
- Approval action calls `revalidatePath()` but no `INSERT` into `hourly_rates`
- `indexation_history` table is empty after running through the full wizard
- Rate change is visible on screen but disappears after page refresh

**Phase to address:** Contracts phase — indexation approval is the most mutation-heavy step in that domain

---

### Pitfall 4: Client-Side Filtering Throughout Demo — 144 `.filter()` Calls

**What goes wrong:**
The demo has 144 `.filter()` calls on in-memory arrays. When porting list views, it is tempting to pass `initialData` and then filter it client-side with `.filter()` for convenience. CLAUDE.md explicitly prohibits this: "NEVER filter data client-side." The problem materializes when a list has more records than one page: client-side filter only applies to the current page, silently returning incomplete results.

**Why it happens:**
Client-side filter works correctly in the demo because all data is in memory. The same one-liner looks identical in a client component receiving `initialData`, but `initialData` only contains page 1's records.

**How to avoid:**
All filtering must go through `fetchList({ eqFilters, orFilter })` in `useEntity`, which pushes predicates to Supabase. The `account-filters.tsx` pattern is the correct template. Never add a `.filter()` call to `initialData` or to state populated from `useEntity`.

**Warning signs:**
- A filter dropdown changes results but only within the current page's records
- Searching for an item known to exist returns no results when on page 2+
- Any `.filter()` on a variable that came from `useEntity` data or `initialData` props

**Phase to address:** Every domain phase — this is a recurring trap, add to phase verification checklist

---

### Pitfall 5: Demo Consultants Are Embedded in Account Objects — Production Has Separate Tables

**What goes wrong:**
In the demo, consultants are stored as `account.consultants[]` — an array embedded in the account object. Tariff history is `consultant.tariefHistorie[]`, also embedded. When porting, a developer may create a `jsonb` column on accounts or consultants to replicate this nesting. This breaks every join query, prevents proper indexing on tariff ranges, and makes the indexation workflow (which needs to iterate all rates for a given year across all contracts) extremely expensive.

**Why it happens:**
The demo's update pattern is `setAcc(prev => prev.map(a => a.id === accId ? {...a, consultants: [...a.consultants, newConsultant]} : a))`. This one-liner makes embedded arrays feel natural. The production schema already has `active_consultants` and `tariff_history` as separate tables — but new tariff-related fields may be added as JSON if the developer follows the demo pattern.

**How to avoid:**
All nested array data from the demo must map to a separate table with a foreign key. Specifically: `tariefHistorie` -> `tariff_history` table, `slaTarieven[].tools` -> `sla_tools` table (already exists), `competenceCenters` -> `account_competence_centers` junction table (already exists). Check CONCERNS.md — the FK constraints were added retroactively in migration `00053`, which shows this pattern already caused real issues once.

**Warning signs:**
- New migration adds a `jsonb` column containing an array of objects with their own IDs
- A query uses `->` or `->>` operator to filter inside a JSON array
- "Search by tariff range" requires fetching all records and filtering in JS

**Phase to address:** Contracts phase and Consultancy phase

---

### Pitfall 6: Revenue Analytics Uses Hardcoded Client/Division/Service Taxonomy

**What goes wrong:**
The demo's `RevenuePage` and `RTForecastTab` rely on `RT_CLIENTS` — a hardcoded list of clients with their divisions and services. The prognose is computed by iterating this constant. If the production port hardcodes client names or division names as string keys in the revenue schema (matching the demo), adding a new client or renaming a division requires a code change, not a data change.

**Why it happens:**
The demo was built for one specific company's client list. It never needed to be dynamic. When porting, the structure looks like a data model but is actually a template.

**How to avoid:**
Revenue entries must reference `account_id` (FK to `accounts`) and `division_id` (FK to `divisions`), never string names. The existing `revenue_entries` table already uses `account_id` — verify any new revenue-related tables follow the same pattern. Service names should be stored as a reference table or as a typed enum, not as raw strings derived from the demo's `RT_CLIENTS` constant.

**Warning signs:**
- Any migration that adds a `client_name text` column instead of `account_id uuid`
- Revenue queries that filter by `WHERE client_name = 'Colruyt'` instead of `WHERE account_id = '...'`
- Prognose "copy last known" logic that looks up values using `revenueData[client.name]`

**Phase to address:** Analytics/Revenue phase

---

### Pitfall 7: Contract Attribution Split Percentage Has No Enforced Constraint

**What goes wrong:**
The demo's contract attribution modal (`ContractAttribModal`) allows setting `ccVerdeling` (split percentage) to any value from a select. There is no validation that the sum of all attributions for a contract totals 100%. In production, if a contract is split 60% to Competence Center A and 60% to Competence Center B, revenue reporting will be overcounted by 20%.

**Why it happens:**
The demo select options are `["4%","8%","...","100%"]` — it's a single attribution, not a multi-party split. When production supports multiple attributions per contract, the sum constraint must be enforced at the DB level.

**How to avoid:**
Add a `CHECK` constraint or trigger that validates `SUM(split_percentage) <= 100` per contract. Alternatively, enforce in the server action with a pre-insert query. The validation must be server-side — client forms are bypassable.

**Warning signs:**
- Revenue totals per account are higher than expected
- A single contract appears multiple times in revenue aggregations
- The attribution modal doesn't show a "remaining %" counter

**Phase to address:** Contracts phase

---

### Pitfall 8: Prognose Is Editable But Has No Save — "Looks Done" After UI Port

**What goes wrong:**
The demo's prognose tab renders an editable forecast table where cells can be changed inline. Since the demo persists nothing, there is no save button — changes are lost on navigation. When porting the UI, the table is recreated and works visually. Developers mark it as "done" without noticing there is no server action wiring. The feature looks complete in a demo but is read-only in production.

**Why it happens:**
The demo's interactivity comes from `setForecast()` local state. The port recreates the same component structure but the `setMode` / `setCustom` handlers need to call server actions that write to `prognose_lines`. The UI is indistinguishable from a wired version until you refresh.

**How to avoid:**
Define the success criterion before building: "After editing a cell and refreshing the page, the edited value persists." Add this as an acceptance test step in every prognose-related task. The prognose feature currently has no queries or actions — these must exist before UI work starts.

**Warning signs:**
- `src/features/prognose/` has no `actions/` or `queries/` directories
- Forecast edits disappear on page refresh
- No `revalidatePath('/admin/prognose')` call anywhere in the feature

**Phase to address:** Analytics phase — must create DB schema and actions before any UI work

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| `any` cast on dynamic Supabase table queries | Avoids complex TypeScript union type | Mutations on wrong table shapes silently succeed; runtime errors only | Never for new code — create typed wrappers instead |
| Skipping `error.tsx` on new routes | Saves 10 lines per route | Default Next.js error UI shown on failure; breaks branded experience | Never — add `error.tsx` to every new `src/app/admin/*` route |
| Adding new UI strings as hardcoded Dutch text | Faster to type | Violates multi-language constraint; requires grep-and-replace later | Never — always add to `messages/nl.json` + `messages/en.json` |
| Client-side filter on `initialData` | Feels instant (no network round-trip) | Only filters current page; silently returns incomplete results | Never — push all filters to Supabase query |
| Storing PDF as base64 in a `text` column | Avoids Storage bucket setup | Row size bloat, no CDN delivery, breaks file management | Never — always use Supabase Storage |
| Adding a `jsonb` column instead of a new table | One migration vs. two | No FK integrity, no indexing, joins across the JSON array are expensive | Only for truly unstructured metadata with no relational needs |
| Skipping `GRANT` in a new migration | One fewer line | RLS policies are silently bypassed (no access = policy never evaluated) | Never — every new table needs explicit `GRANT` |
| Console.error for query failures | Already in codebase | Errors invisible in production; no alerting possible | Acceptable until observability tooling is added (known debt) |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Supabase Storage for contracts/HR docs | Upload without setting bucket's public/private policy | Set bucket to private; generate signed URLs for download; never expose raw paths |
| Supabase RLS with junction tables | Applying RLS only to main table, not to the junction | Every junction table (e.g., `account_competence_centers`) needs its own RLS policy |
| `onAuthStateChange` with Supabase queries | `await supabase.from(...)` inside callback — deadlocks | Non-blocking pattern documented in CLAUDE.md — this has already caused real issues |
| `React.cache()` on queries | Wrapping mutations instead of only read queries | Only wrap `get-*` queries in `React.cache()`; actions must never be cached |
| `revalidatePath` after mutations | Forgetting to call it, or calling with wrong path | Every server action must call `revalidatePath` for the affected route(s) after mutation |
| proxy.ts route permissions | Adding a new `/admin/x` route without adding it to `routePermissions` | Update `src/proxy.ts` when adding every new admin route — see CONCERNS.md |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Revenue aggregation in JS from all rows | Revenue page loads slowly as data grows | Use Postgres `SUM()` aggregation queries, never fetch all rows and reduce | ~500+ revenue entries |
| N+1 on consultant list with tariff history | Each consultant card triggers a separate `tariff_history` query | Use a single query with a join or `select('*, tariff_history(*)')` | >50 consultants |
| Promise.all chains for relation sync without rollback | Partial save leaves data inconsistent | Wrap in a Postgres function/RPC that runs as a single transaction | Any network interruption during account save |
| `useRealtime` on paginated views | INSERTs prepend without respecting page boundaries | Only use `useRealtime` for non-paginated views (dashboard counters, notifications) | First INSERT on page 2+ |
| Large account form (767 lines) re-renders on every keystroke | Typing in one field causes full form re-render | Memoize subsections (`React.memo`) and wrap handlers in `useCallback` | Already impacts current UX |
| `useEntity` without cancellation flag | Stale updates after rapid navigation | Implement cancellation flag pattern from CLAUDE.md in `use-entity.ts` | Already exists as known bug |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| RLS on main table only, not junction tables | Users can read/write relations for accounts they don't own | Audit every `account_*` junction table for RLS policy coverage |
| Server action accepts `account_id` from client without ownership check | User passes another user's account ID | Server action must verify caller owns/has access to the resource via RLS or explicit check |
| File upload validation client-side only | Malicious file types or oversized files bypass validation | Add server-side size and MIME validation before Storage upload — currently missing (CONCERNS.md) |
| New admin route without proxy.ts entry | Route accessible to users without required role | Add to `routePermissions` in `src/proxy.ts` for every new `/admin/*` route |
| Salary/loon data readable by all authenticated users | Sensitive HR data exposed | `employees` salary fields need restrictive RLS — only HR role or own record |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Prognose resets to defaults on every visit | Users lose manually entered forecast values | Persist prognose lines to DB before shipping the feature |
| Indexation approval has no confirmation of what changed | Manager approves without seeing the diff clearly | Show old rate vs new rate diff in approval step; log to indexation_history immediately |
| Contract attribution form doesn't show remaining split % | User inadvertently creates over-100% attribution | Show live "remaining: X%" counter; disable save when sum > 100% |
| i18n strings added as hardcoded Dutch | Mixed languages in UI if locale switches to EN | Every new string must go in `messages/nl.json` + `messages/en.json`, even for Dutch-only labels |
| No `loading.tsx` on new routes | Blank white flash before server component resolves | Add skeleton `loading.tsx` matching page layout for every new `src/app/admin/*` route |
| Error state shows generic message | User cannot tell if failure is a network error, validation error, or auth error | Use `ErrorFormatter` pattern (CONCERNS.md) to convert `ActionResult` errors to user-readable messages |

---

## "Looks Done But Isn't" Checklist

- [ ] **Prognose editing:** Appears interactive but verify: edit a cell, refresh — does the value persist? If not, actions/queries are missing.
- [ ] **Indexation approval:** Wizard completes visually — verify: a new `hourly_rates` row exists for next year after approval.
- [ ] **File upload on contracts/HR:** Upload succeeds — verify: storage path is stored in DB (not base64), and file is retrievable via signed URL.
- [ ] **Account revenue tab:** Tab renders — verify: data comes from `revenue_entries` table filtered by `account_id`, not from `account.omzet[]` JSON.
- [ ] **Consultant contract attribution:** Attribution modal saves — verify: `SUM(split_percentage)` per contract does not exceed 100%.
- [ ] **New admin route:** Route renders — verify: it appears in `src/proxy.ts` `routePermissions` with correct role.
- [ ] **New migration:** Table created — verify: `GRANT SELECT, INSERT, UPDATE, DELETE` statement is present in the same migration.
- [ ] **New UI string:** Text appears on screen — verify: string is in `messages/nl.json` and `messages/en.json`, not hardcoded.
- [ ] **List filtering:** Filter dropdown changes results — verify: filtering works correctly on page 2, not just page 1.
- [ ] **New route added:** Page exists — verify: `loading.tsx` and `error.tsx` files exist alongside `page.tsx`.

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Base64 stored in DB columns | HIGH | Write migration to extract base64, upload to Storage, replace column value with Storage path; test file retrieval |
| Client-side filter shipped to production | MEDIUM | Replace `.filter()` with `eqFilters`/`orFilter` in `fetchList`; test on large dataset; no migration needed |
| Prognose state lost on every visit | MEDIUM | Add `prognose_lines` table migration; add queries/actions; seed existing forecast data from demo constants |
| Missing GRANT on table | LOW | Add `GRANT` in a new migration; verify with `select * from information_schema.role_table_grants` |
| Missing proxy.ts entry | LOW | Add route + permission mapping; test with non-admin user that access is correctly blocked |
| Indexation approved but no rate rows created | HIGH | Identify approval records; backfill `hourly_rates` rows manually; fix action to write correct rows going forward |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Revenue/prognose has no DB schema | Analytics phase start — must create schema before any UI | Query `prognose_lines` table exists; `src/features/prognose/queries/` and `actions/` directories exist |
| Base64 file storage | Any phase introducing document fields (Contracts, HR) | Storage bucket path in DB column; download retrieves file from Storage |
| Indexation approval missing DB writes | Contracts phase | `hourly_rates` row count increases after approval; `indexation_history` entry created |
| Client-side filtering | Every phase — add to phase acceptance criteria | Filter works correctly on page 2 with >10 items |
| Embedded arrays as jsonb | Every phase adding relational data | No `jsonb` columns containing arrays of objects with IDs |
| Revenue taxonomy hardcoded | Analytics phase | Revenue entries reference `account_id`, not `client_name` string |
| Attribution sum > 100% | Contracts phase | DB constraint or action-level validation rejects over-100% splits |
| Missing GRANT in migration | Every phase adding new tables | `information_schema.role_table_grants` shows grants for authenticated role |
| Missing proxy.ts entry | Every phase adding new routes | Non-admin user redirected correctly from new route |
| i18n strings hardcoded | Every phase adding UI | `messages/nl.json` has entry; `messages/en.json` has entry |

---

## Sources

- Direct inspection: `demo_crm/src/App.tsx` (5809 lines) — identified all in-memory state patterns
- Direct inspection: `demo_crm/src/utils.ts` — financial calculation implementations
- Direct inspection: `.planning/codebase/CONCERNS.md` — existing bugs, fragile areas, security gaps
- Direct inspection: `src/features/prognose/types.ts` — confirmed no queries or actions exist
- Direct inspection: `src/features/contracts/types.ts` — confirmed correct Storage URL pattern exists
- Direct inspection: `supabase/migrations/00053_add_missing_fk_constraints.sql` name — confirms FK gaps already caused real issues
- Project rules: `CLAUDE.md` — architecture constraints, filtering rules, action result pattern

---
*Pitfalls research for: PHPro CRM demo-to-production port*
*Researched: 2026-03-20*
