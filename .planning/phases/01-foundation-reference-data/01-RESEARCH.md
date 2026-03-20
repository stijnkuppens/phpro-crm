# Phase 1: Foundation & Reference Data - Research

**Researched:** 2026-03-20
**Domain:** Database reference data modeling, schema migration (text[] to FK), library installation
**Confidence:** HIGH

## Summary

Phase 1 creates the data foundation for the entire CRM port. There are 13 reference data sets currently hardcoded as TypeScript constants in `demo_crm/src/constants.ts` (and duplicated in `src/features/accounts/components/account-form.tsx` lines 30-70). All must become proper Supabase tables with production data seeded via `supabase/data/` files.

The most complex part is the schema migration: existing junction tables like `account_samenwerkingsvormen` currently use hardcoded CHECK constraints (e.g., `CHECK (type IN ('Project', 'Continuous Dev.', ...))`) and freetext string columns (e.g., `account_tech_stacks.technology text`). These must be migrated to FK references pointing to the new lookup tables. This affects existing fixture data, existing queries (`get-account.ts`), existing actions (`manage-account-relations.ts`), and the account form component.

Additionally, three libraries (recharts via shadcn chart, react-number-format, nuqs) must be installed, and an admin UI for managing reference tables must be built.

**Primary recommendation:** Create reference tables first, then migrate junction tables to use FKs, then update fixtures, then update application code, then install libraries. Migration ordering is critical -- reference tables must exist before junction table FK constraints can be added.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- ALL 13 reference data sets from `demo_crm/src/constants.ts` must become proper Supabase tables -- no constants-in-code approach
- Entity-like data (CC names, hosting providers, consultant roles, tariff roles) AND pure suggestion lists (hobbies, SLA tools, tech suggestions) all get DB tables
- Tables should be seeded via `supabase/data/` files (production data, runs in every environment)
- An admin UI for managing reference tables should be built in this phase -- not deferred to Phase 10
- Existing text array columns on the accounts table must be migrated to proper FK relationships with junction tables
- This is done in Phase 1 alongside the reference table creation -- one clean migration, not spread across phases
- All existing queries, actions, and components that read/write these columns will need updating
- Expand BEYOND the demo -- aim for 10+ accounts, 20+ contacts for more realistic testing
- Update ALL existing fixture files to reference the new FK-based reference tables correctly
- Add `react-is` override to `package.json` for recharts React 19 compatibility
- Add `NuqsAdapter` to root layout
- Use `npx shadcn@latest add chart` (shadcn chart component wrapping recharts)
- Install `react-number-format` for currency input fields

### Claude's Discretion
- Exact table schema design for each reference table (columns, constraints, indexes)
- Junction table naming conventions
- Migration ordering to avoid FK constraint issues
- How to handle the text[] to FK data migration (data transformation SQL)
- NuqsAdapter placement in the provider hierarchy

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| FOUND-01 | All reference data tables populated in `supabase/data/` | 13 reference data sets identified from constants.ts; schema designs documented below; existing `supabase/data/` pattern established |
| FOUND-02 | All demo entity fixtures updated in `supabase/fixtures/` | Current fixtures have 3 accounts and 4 contacts; must expand to 10+ and 20+; FK references must be updated after schema migration |
| FOUND-03 | Install recharts + shadcn chart component | Use `npx shadcn@latest add chart`; requires `react-is` override in package.json for React 19 compat; recharts stays on v2.x |
| FOUND-04 | Install react-number-format for currency inputs | Latest version 5.4.4; no React 19 compatibility issues |
| FOUND-05 | Install nuqs for URL-based filter state | Version 2.8.9; NuqsAdapter wraps children in root layout; potential Next.js 16 detection issue (see pitfalls) |

</phase_requirements>

## Standard Stack

### Core (libraries to install)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| recharts | 2.15.4 (via shadcn chart) | Chart rendering for analytics | shadcn chart component wraps recharts; v2.x required (shadcn not yet ported to v3) |
| react-is | ^19.2.4 | React 19 peer dep fix for recharts | recharts depends on react-is which must match React version |
| react-number-format | 5.4.4 | Currency/number input formatting | De facto standard for formatted number inputs in React |
| nuqs | 2.8.9 | URL-based query state management | Type-safe search params; used for analytics filter state |

### Already Installed (relevant to this phase)

| Library | Purpose | Notes |
|---------|---------|-------|
| @supabase/supabase-js 2.99.1 | Database client | Used for all queries/actions |
| zod 4.3.6 | Schema validation | Used for form validation |
| shadcn 4.0.5 | CLI for adding components | Used to add chart component |

**Installation:**
```bash
# Install recharts with react-is override
npm install react-number-format nuqs
npx shadcn@latest add chart
```

Then add to `package.json`:
```json
{
  "overrides": {
    "react-is": "$react"
  }
}
```

**Version verification:** Versions confirmed via `npm view` on 2026-03-20.

## Architecture Patterns

### Reference Table Schema Pattern

All 13 reference tables follow a simple lookup table pattern:

```sql
CREATE TABLE ref_<name> (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  sort_order integer DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

**Key design decisions:**
- `name text NOT NULL UNIQUE` -- the display value, must be unique
- `sort_order integer` -- allows admin to control display order
- `is_active boolean` -- soft-disable without deleting (preserves FK integrity)
- UUID primary key -- consistent with all other tables in the project

### The 13 Reference Data Sets

Based on `demo_crm/src/constants.ts`, here are the reference tables needed:

| # | Constant | Table Name | Row Count | Notes |
|---|----------|-----------|-----------|-------|
| 1 | CC_NAMEN | ref_competence_centers | 10 | Induxx, Humix, Skivvy, etc. |
| 2 | CC_SERVICES | ref_cc_services | 12 | PIM, UX/UI, Strategie, etc. |
| 3 | CONSULTANT_ROLES / TARIEF_ROLLEN | ref_consultant_roles | 12 | Dev Junior, Dev Medior, etc. (CONSULTANT_ROLES and TARIEF_ROLLEN are nearly identical) |
| 4 | TECH_SUGGESTIONS | ref_technologies | 30 | PHP, JavaScript, React, etc. |
| 5 | HOSTING_PROVIDERS | ref_hosting_providers | 14 | AWS, Azure, Combell, etc. |
| 6 | HOSTING_OMGEVINGEN | ref_hosting_environments | 5 | Productie, Staging, etc. |
| 7 | TALEN_LIJST | ref_languages | 8 | Nederlands, Frans, Engels, etc. |
| 8 | TAAL_NIVEAUS | ref_language_levels | 4 | Basis, Gevorderd, Vloeiend, Moedertaal |
| 9 | CONTACT_ROLES | ref_contact_roles | 9 | Decision Maker, Influencer, etc. |
| 10 | HOBBY_SUGGESTIONS | ref_hobbies | 40 | Fietsen, Golf, Gaming, etc. |
| 11 | SLA_TOOL_SUGGESTIONS | ref_sla_tools | 20 | Graylog, New Relic, Datadog, etc. |
| 12 | SAMENWERKINGSVORMEN | ref_collaboration_types | 5 | Project, Continuous Dev., etc. |
| 13 | STOPZET_REDENEN | ref_stop_reasons | 6 | Contract afgelopen, etc. |

**Note:** VERDELING_OPTIES ("4%", "50/50") is only 2 values and is used as a CHECK constraint on `account_competence_centers.distribution`. This can remain a CHECK constraint -- it does not need a separate table. AGORIA_INDICES already has its own table (`indexation_indices`), so it does not need a new reference table.

### Junction Table Migration Pattern

Current state: junction tables store freetext strings.
Target state: junction tables FK to reference tables.

**Example -- `account_tech_stacks`:**
```sql
-- Current: technology text NOT NULL (freetext)
-- Target:  technology_id uuid NOT NULL REFERENCES ref_technologies(id)

-- Migration steps:
-- 1. Add new FK column
ALTER TABLE account_tech_stacks ADD COLUMN technology_id uuid REFERENCES ref_technologies(id);

-- 2. Populate FK from existing text values
UPDATE account_tech_stacks ats
SET technology_id = rt.id
FROM ref_technologies rt
WHERE ats.technology = rt.name;

-- 3. Handle orphans (text values not in ref table) -- insert them first
INSERT INTO ref_technologies (name)
SELECT DISTINCT technology FROM account_tech_stacks
WHERE technology NOT IN (SELECT name FROM ref_technologies)
ON CONFLICT (name) DO NOTHING;

-- 4. Re-run the UPDATE for orphans
-- 5. Make FK NOT NULL
ALTER TABLE account_tech_stacks ALTER COLUMN technology_id SET NOT NULL;

-- 6. Drop old text column
ALTER TABLE account_tech_stacks DROP COLUMN technology;

-- 7. Add unique constraint to prevent duplicates
CREATE UNIQUE INDEX idx_account_tech_stacks_unique
  ON account_tech_stacks (account_id, technology_id);
```

**Tables that need FK migration:**

| Junction Table | Current Column | New FK Column | Reference Table |
|---------------|----------------|---------------|-----------------|
| account_tech_stacks | technology text | technology_id uuid | ref_technologies |
| account_manual_services | service_name text | -- | Keep as-is or FK to ref_cc_services |
| account_samenwerkingsvormen | type text (CHECK) | collaboration_type_id uuid | ref_collaboration_types |
| account_hosting | provider text | provider_id uuid | ref_hosting_providers |
| account_hosting | environment text | environment_id uuid | ref_hosting_environments |
| account_competence_centers | cc_name text | competence_center_id uuid | ref_competence_centers |
| account_competence_centers | services text[] | -- | Needs new junction: account_cc_services |
| account_services | service_name text | service_id uuid | ref_cc_services |

**Critical: `account_competence_centers.services text[]`** -- This is a text array column that must become a proper junction table (`account_cc_services` or similar) linking account_competence_centers to ref_cc_services.

**Critical: `account_samenwerkingsvormen` CHECK constraint** must be dropped when migrating to FK:
```sql
ALTER TABLE account_samenwerkingsvormen DROP CONSTRAINT account_samenwerkingsvormen_type_check;
```

### Migration Ordering (Critical)

Migrations must be ordered to avoid FK constraint violations:

1. **Migration A: Create all `ref_*` tables** (no dependencies on other tables)
2. **Migration B: Alter junction tables** -- add FK columns, migrate data, drop old columns
3. **Data file: Seed reference data** in `supabase/data/004_reference_data.sql`
4. **Fixture update: Update all fixture files** to use FK references

**Important:** The data seed file must run BEFORE fixtures, because fixtures reference the FK IDs. In `seed.sql`, data files run before fixture files, so this is already correct.

### NuqsAdapter Placement

Place `NuqsAdapter` inside `ThemeProvider` and `NextIntlClientProvider`, wrapping `{children}`:

```tsx
// src/app/layout.tsx
import { NuqsAdapter } from 'nuqs/adapters/next/app';

// In the JSX:
<ThemeProvider ...>
  <NextIntlClientProvider messages={messages}>
    <NuqsAdapter>
      {children}
    </NuqsAdapter>
    <Toaster />
  </NextIntlClientProvider>
</ThemeProvider>
```

NuqsAdapter needs to be inside the providers it depends on (i18n, theme) but wrapping the page content. It is a client-side context provider.

### Admin UI for Reference Tables

The admin UI should be a single page at `/admin/reference-data` (or `/admin/settings/reference-data`) that lets admins manage all 13 lookup tables. Recommended approach:

- **One page with a tabbed or sidebar layout** -- not 13 separate pages
- Each tab shows a simple editable list (name, sort_order, is_active toggle)
- Uses `useEntity` hook per selected table for CRUD operations
- Server action pattern: generic `updateReferenceItem(table, id, values)` similar to existing `manage-account-relations.ts`

This avoids creating 13 feature modules for simple lookup tables. A single `src/features/reference-data/` module is sufficient.

### Recommended Project Structure for New Code

```
supabase/
  migrations/
    00054_reference_tables.sql      # Create all ref_* tables
    00055_junction_table_fk_migration.sql  # Alter junction tables to use FKs
  data/
    004_reference_data.sql          # Seed all reference data

src/features/reference-data/
  types.ts                          # ReferenceTable type, Zod schemas
  queries/get-reference-items.ts    # Generic query for any ref_* table
  actions/manage-reference-items.ts # Generic CRUD for ref_* tables
  components/reference-data-page.tsx # Admin UI component

src/app/admin/reference-data/
  page.tsx
  loading.tsx
  error.tsx
```

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Chart rendering | Custom SVG charts | `npx shadcn@latest add chart` (recharts wrapper) | Consistent with shadcn/ui; handles responsiveness, themes, tooltips |
| Currency formatting | Custom input masking | `react-number-format` NumericFormat component | Locale-aware, handles edge cases (paste, cursor position, negative) |
| URL query state | Custom useSearchParams wrapper | `nuqs` useQueryState/useQueryStates | Type-safe, handles serialization, shallow routing, SSR |
| Reference table CRUD | 13 separate feature modules | One generic reference-data module with dynamic table selection | All ref tables have identical schema (name, sort_order, is_active) |
| Data migration SQL | Manual INSERT/UPDATE per row | Bulk UPDATE...FROM pattern | Handles orphan values, is atomic, runs in single transaction |

## Common Pitfalls

### Pitfall 1: Migration Order -- FK Before Reference Data Exists
**What goes wrong:** Junction table FK migration runs before reference data is seeded, causing FK violations on existing fixture data.
**Why it happens:** Migrations run before `seed.sql`. If the FK migration includes `NOT NULL` constraint immediately, existing fixture rows (loaded later) fail.
**How to avoid:** The migration itself must handle data transformation. Either: (a) seed reference data IN the migration file itself (before altering FKs), or (b) make FK columns nullable initially and add a separate migration to set NOT NULL after data loads. Option (a) is cleaner -- the migration is self-contained.
**Warning signs:** `db:reset` fails with FK constraint violations.

### Pitfall 2: CHECK Constraint Conflicts
**What goes wrong:** `account_samenwerkingsvormen` has `CHECK (type IN ('Project', 'Continuous Dev.', ...))`. When migrating to FK, the CHECK must be dropped first. If forgotten, the column can't be dropped.
**Why it happens:** The original migration hardcoded allowed values as a CHECK constraint.
**How to avoid:** Migration must explicitly `DROP CONSTRAINT` before altering the column.

### Pitfall 3: Freetext Values Not in Reference Table
**What goes wrong:** Existing fixture/production data has freetext values that don't exactly match the reference table entries (capitalization, spacing, typos).
**Why it happens:** Freetext columns accepted anything; reference tables enforce exact matches.
**How to avoid:** Migration must INSERT any orphan values into the reference table first, then UPDATE FKs. Use `INSERT...SELECT DISTINCT...ON CONFLICT DO NOTHING` pattern.

### Pitfall 4: account_competence_centers.services text[] Array
**What goes wrong:** This column is a text array, not a simple text column. It holds multiple CC service names per competence center entry. Migrating this to FK requires a new junction table, not just a column rename.
**Why it happens:** The original schema used text[] for simplicity.
**How to avoid:** Create `account_cc_services(id, account_competence_center_id, service_id)` junction table. Migrate data with `unnest(services)` to expand array into rows.

### Pitfall 5: Existing Queries and Actions Need Updating
**What goes wrong:** After FK migration, `get-account.ts` SELECT still uses `account_tech_stacks(*)` which returns `technology_id` instead of `technology`. The overview tab and form components break.
**Why it happens:** The join now returns a UUID FK column instead of the display name.
**How to avoid:** Update queries to join through to the reference table: `tech_stacks:account_tech_stacks(*, technology:ref_technologies(name))`. Update components to access `item.technology.name` instead of `item.technology`.

### Pitfall 6: nuqs NuqsAdapter Detection Issue with Next.js 16
**What goes wrong:** nuqs may fail to detect the adapter in certain configurations with Next.js 16.
**Why it happens:** Package resolution can create multiple nuqs instances. Issue #1263 on GitHub.
**How to avoid:** Ensure single version resolution. If issues occur, pin to nuqs 2.8.3 or add the package to overrides in package.json.

### Pitfall 7: recharts v3 Incompatibility
**What goes wrong:** Installing `recharts` without version pinning pulls v3.8.0 which is incompatible with the shadcn chart component.
**Why it happens:** shadcn chart is built for recharts v2.x; v3 has breaking TypeScript type changes.
**How to avoid:** The `npx shadcn@latest add chart` command installs the correct recharts version. Do NOT manually install recharts separately. Verify after install: `npm ls recharts` should show a 2.x version.

### Pitfall 8: Fixture File FK ID References
**What goes wrong:** After migrating junction tables to FKs, fixture files must INSERT using UUIDs from reference tables, not string values.
**Why it happens:** Old pattern: `INSERT INTO account_tech_stacks (account_id, technology) VALUES (..., 'PHP')`. New pattern requires the UUID of the 'PHP' row in ref_technologies.
**How to avoid:** Use subqueries in fixtures: `(SELECT id FROM ref_technologies WHERE name = 'PHP')`. Or use fixed UUIDs for reference data and reference those directly.

## Code Examples

### Reference Table Migration (self-contained)
```sql
-- Source: project convention from supabase/data/*.sql pattern
-- This goes in a MIGRATION file (not data file) because it creates schema

CREATE TABLE ref_technologies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  sort_order integer DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON ref_technologies
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE ref_technologies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ref_technologies_select" ON ref_technologies FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "ref_technologies_insert" ON ref_technologies FOR INSERT TO authenticated
  WITH CHECK (get_user_role() IN ('admin'));
CREATE POLICY "ref_technologies_update" ON ref_technologies FOR UPDATE TO authenticated
  USING (get_user_role() IN ('admin'))
  WITH CHECK (get_user_role() IN ('admin'));
CREATE POLICY "ref_technologies_delete" ON ref_technologies FOR DELETE TO authenticated
  USING (get_user_role() IN ('admin'));

GRANT SELECT ON ref_technologies TO authenticated;
GRANT INSERT, UPDATE, DELETE ON ref_technologies TO authenticated;
```

**RLS note:** Reference tables use `get_user_role()` function (matching existing pattern in `00011_accounts.sql`), with admin-only write access. SELECT is open to all authenticated users.

### Fixture Pattern with FK Subqueries
```sql
-- Source: project convention, adapted for FK references
DELETE FROM account_tech_stacks WHERE account_id IN ('a0000000-...-000000000001', ...);
INSERT INTO account_tech_stacks (account_id, technology_id) VALUES
  ('a0000000-...-000000000001', (SELECT id FROM ref_technologies WHERE name = 'SAP')),
  ('a0000000-...-000000000001', (SELECT id FROM ref_technologies WHERE name = 'PIMcore')),
  ('a0000000-...-000000000001', (SELECT id FROM ref_technologies WHERE name = 'Magento'));
```

### Updated Query Pattern
```typescript
// Source: adapted from src/features/accounts/queries/get-account.ts
export const getAccount = cache(
  async (id: string): Promise<AccountWithRelations | null> => {
    const supabase = await createServerClient();
    const { data, error } = await supabase
      .from('accounts')
      .select(`
        *,
        owner:user_profiles!owner_id(id, full_name),
        tech_stacks:account_tech_stacks(id, technology:ref_technologies(id, name)),
        samenwerkingsvormen:account_samenwerkingsvormen(id, collaboration_type:ref_collaboration_types(id, name)),
        hosting:account_hosting(id, provider:ref_hosting_providers(id, name), environment:ref_hosting_environments(id, name), url, notes),
        competence_centers:account_competence_centers(id, cc:ref_competence_centers(id, name), contact_person, email, phone, distribution),
        services:account_services(id, service:ref_cc_services(id, name)),
        manual_services:account_manual_services(*)
      `)
      .eq('id', id)
      .single();

    if (error) return null;
    return account as unknown as AccountWithRelations;
  },
);
```

### Generic Reference Data Action
```typescript
// Source: adapted from manage-account-relations.ts pattern
'use server';

import { createServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/require-permission';
import { ok, err, type ActionResult } from '@/lib/action-result';
import { z } from 'zod';

const refTableNames = [
  'ref_competence_centers', 'ref_cc_services', 'ref_consultant_roles',
  'ref_technologies', 'ref_hosting_providers', 'ref_hosting_environments',
  'ref_languages', 'ref_language_levels', 'ref_contact_roles',
  'ref_hobbies', 'ref_sla_tools', 'ref_collaboration_types', 'ref_stop_reasons',
] as const;

type RefTable = typeof refTableNames[number];

const refItemSchema = z.object({
  name: z.string().min(1),
  sort_order: z.number().int().optional(),
  is_active: z.boolean().optional(),
});

export async function updateReferenceItem(
  table: RefTable,
  id: string,
  values: z.infer<typeof refItemSchema>,
): Promise<ActionResult> {
  await requirePermission('settings.write');
  const parsed = refItemSchema.parse(values);
  const supabase = await createServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from(table) as any).update(parsed).eq('id', id);
  if (error) return err(error.message);
  return ok();
}
```

### NuqsAdapter Integration
```tsx
// Source: nuqs official docs (https://nuqs.dev/docs/adapters)
// In src/app/layout.tsx, add inside the provider hierarchy:
import { NuqsAdapter } from 'nuqs/adapters/next/app';

// Wrap {children} but keep Toaster outside:
<NuqsAdapter>
  {children}
</NuqsAdapter>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Hardcoded constants in TS | Database lookup tables | This phase | All reference data becomes admin-manageable |
| text/text[] columns for relations | UUID FK to lookup tables | This phase | Referential integrity, consistent naming, no orphan values |
| String CHECK constraints | FK to reference tables | This phase | Adding new values via admin UI instead of migrations |
| recharts v3 with shadcn | recharts v2.x with shadcn chart | Current | shadcn chart not yet ported to recharts v3 |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | No automated test framework detected |
| Config file | None |
| Quick run command | N/A |
| Full suite command | `npm run build` (type-check + build verification) |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FOUND-01 | All 13 ref tables exist and are seeded | smoke | `task db:reset` + query ref tables | N/A - DB verification |
| FOUND-02 | Fixtures load without FK errors | smoke | `task db:reset` completes without errors | N/A - DB verification |
| FOUND-03 | recharts + chart component installed | build | `npm run build` succeeds | N/A |
| FOUND-04 | react-number-format installed | build | `npm run build` succeeds | N/A |
| FOUND-05 | nuqs installed, NuqsAdapter in layout | build | `npm run build` succeeds | N/A |

### Sampling Rate
- **Per task commit:** `npm run build` (type-check)
- **Per wave merge:** `task db:reset` + `npm run build`
- **Phase gate:** Full `task db:reset` + `npm run build` + verify ref tables have data

### Wave 0 Gaps
- No automated test framework exists -- all validation is manual (build + DB reset)
- Verification of reference data seeding requires manual SQL queries or a smoke test script
- Consider adding a `scripts/verify-ref-data.sql` that queries all 13 ref tables and checks row counts

## Open Questions

1. **CONSULTANT_ROLES vs TARIEF_ROLLEN overlap**
   - What we know: `CONSULTANT_ROLES` has 12 entries, `TARIEF_ROLLEN` has 12 entries, they are nearly identical
   - What's unclear: Should these be one table or two? TARIEF_ROLLEN is used for hourly rate roles, CONSULTANT_ROLES for bench/active consultant roles
   - Recommendation: Use ONE table (`ref_consultant_roles`) -- the values are identical. If they diverge later, add a `role_type` column or `is_tariff_role` flag.

2. **account_manual_services purpose**
   - What we know: Currently stores freetext service names per account. CC_SERVICES and this table seem to overlap.
   - What's unclear: Is `account_manual_services` a free-text override, or should it also FK to `ref_cc_services`?
   - Recommendation: Migrate to FK `ref_cc_services` same as `account_services`. If truly custom services are needed, keep the freetext column alongside the FK as an "other" field.

3. **Fixed UUIDs vs subqueries for reference data**
   - What we know: Using fixed UUIDs in data files makes fixtures simpler to write. Using `gen_random_uuid()` requires subqueries.
   - What's unclear: Which approach is more maintainable?
   - Recommendation: Use fixed deterministic UUIDs for reference data (e.g., UUID v5 from namespace + name). This makes fixture files and migrations cleaner. Example: `'ref-tech-0001-0000-000000000001'` for PHP.

## Sources

### Primary (HIGH confidence)
- Direct inspection: `demo_crm/src/constants.ts` -- all 13 reference data sets with exact values
- Direct inspection: `supabase/migrations/00011_accounts.sql` -- current junction table schemas, RLS patterns, CHECK constraints
- Direct inspection: `src/features/accounts/components/account-form.tsx` -- hardcoded constants duplicated from demo
- Direct inspection: `src/features/accounts/queries/get-account.ts` -- current query pattern
- Direct inspection: `src/features/accounts/actions/manage-account-relations.ts` -- current mutation pattern
- Direct inspection: `supabase/fixtures/002_crm_data.sql` -- current fixture format (3 accounts, 4 contacts)
- Direct inspection: `supabase/seed.sql` -- data runs before fixtures (correct order)
- Direct inspection: `src/app/layout.tsx` -- current provider hierarchy
- npm registry: recharts 2.15.4, react-number-format 5.4.4, nuqs 2.8.9

### Secondary (MEDIUM confidence)
- [shadcn/ui chart docs](https://ui.shadcn.com/docs/components/radix/chart) -- chart component uses recharts v2.x
- [nuqs adapters docs](https://nuqs.dev/docs/adapters) -- NuqsAdapter setup for Next.js App Router
- [shadcn React 19 compatibility](https://ui.shadcn.com/docs/react-19) -- react-is override pattern

### Tertiary (LOW confidence)
- [nuqs #1263](https://github.com/47ng/nuqs/issues/1263) -- Next.js 16 adapter detection issue; may or may not affect this project (monorepo-specific)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- versions verified via npm registry, compatibility confirmed via official docs
- Architecture: HIGH -- based on direct inspection of existing codebase patterns and demo source
- Pitfalls: HIGH -- migration patterns verified against existing schema; identified real CHECK constraint and text[] array issues

**Research date:** 2026-03-20
**Valid until:** 2026-04-20 (stable domain -- database migrations and library versions unlikely to change)
