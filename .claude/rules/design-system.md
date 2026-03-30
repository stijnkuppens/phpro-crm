# PHPro CRM Design System

Developer reference for building admin pages and components that match the existing UI. Start here before writing any new page or component.

---

## Design Tokens

### Colors

Tokens are defined as CSS custom properties in `src/app/globals.css` and exposed as Tailwind utility classes via the `@theme inline` block.

#### Base tokens (`:root` — neutral defaults)

| Token | Tailwind class | Description |
|-------|---------------|-------------|
| `--background` | `bg-background` | Page background (white) |
| `--foreground` | `text-foreground` | Body text (near-black) |
| `--card` | `bg-card` | Card / elevated surface (white) |
| `--card-foreground` | `text-card-foreground` | Text on cards |
| `--primary` | `bg-primary` | Brand color — buttons, active states |
| `--primary-action` | `text-primary-action` | Brand text on white backgrounds (darker shade) |
| `--primary-foreground` | `text-primary-foreground` | Text on primary-colored backgrounds |
| `--muted` | `bg-muted` | Page tint, skeleton fills |
| `--muted-foreground` | `text-muted-foreground` | Secondary / placeholder text |
| `--accent` | `bg-accent` | Hover tint (sidebar, dropdowns) |
| `--border` | `border-border` | Dividers, input borders |
| `--ring` | `ring-ring` | Focus outline |
| `--destructive` | `bg-destructive` | Danger actions, error states |
| `--sidebar` | `bg-sidebar` | Sidebar background |

#### Brand overrides

Set via `data-brand` attribute on `<html>`. Brand switching is controlled by:
- Hook: `src/lib/hooks/use-brand-theme.ts` (`useBrandTheme`) — dispatches `CustomEvent` so all instances sync
- Switcher UI: `src/components/layout/brand-switcher.tsx` (in topbar)
- CSS variables: `src/app/globals.css` — scoped under `[data-brand="phpro"]` and `[data-brand="25carat"]`

Never write brand-specific selectors in component CSS.

**PHPro** (`[data-brand="phpro"]`)
- `--primary`: `#bdd431` (lime green)
- `--primary-action`: `#7a8a1e` (dark olive — text on white)
- `--primary-foreground`: `#1a1a1a`
- `--accent`: `#eef5c8` (light green hover tint)

**25Carat** (`[data-brand="25carat"]`)
- `--primary`: `#C5A053` (gold)
- `--primary-action`: `#96782e` (dark bronze — text on white)
- `--primary-foreground`: `#ffffff`
- `--accent`: `#f5edd8` (warm gold hover tint)
- `--muted`: `#f9f6ee` (warm beige page background)

Dark mode variants exist for both brands — always test both.

#### `--primary-action` — the "text on white" token

`--primary-action` is the brand color safe to use as text or icon color on white/card backgrounds. It is always darker than `--primary` (which is the button fill color). Use `text-primary-action` anywhere you want brand-colored text:

```tsx
// Good — brand-colored text link
<a className="text-primary-action hover:underline">View details</a>

// Good — brand-colored icon in a table action button
<Button className="hover:text-primary-action hover:bg-primary/10">
  <Pencil />
</Button>
```

#### Category badge colors (hardcoded intentionally)

These represent distinct data categories and need fixed visual differentiation regardless of brand:

```tsx
// src/features/accounts/types.ts
export const ACCOUNT_TYPE_STYLES: Record<string, string> = {
  Klant:    'bg-green-100 text-green-700',
  Prospect: 'bg-blue-100 text-blue-700',
  Partner:  'bg-orange-100 text-orange-700',
};

// src/features/consultants/types.ts
export const CONSULTANT_STATUS_STYLES: Record<ConsultantStatus, string> = {
  bench:     'bg-orange-100 text-orange-700',
  actief:    'bg-green-100 text-green-700',
  stopgezet: 'bg-muted text-muted-foreground',
};

export const contractStatusColors: Record<ContractStatus, string> = {
  actief:      'bg-green-100 text-green-800',
  waarschuwing:'bg-yellow-100 text-yellow-800',
  kritiek:     'bg-red-100 text-red-800',
  verlopen:    'bg-gray-100 text-gray-800',
  onbepaald:   'bg-blue-100 text-blue-800',
  stopgezet:   'bg-gray-300 text-gray-600',
};
```

Pass these maps to `StatusBadge` via `colorMap`. Do not define new per-category hardcoded colors in components — add them to the shared map in the feature's `types.ts`.

---

### Typography

Single font: **Geist** via `next/font/local` (configured in the root layout). Set as `--font-sans`.

| Usage | Class | Example |
|-------|-------|---------|
| Page title | `text-2xl font-bold tracking-tight` | `PageHeader` h1 |
| Section header | `text-sm font-semibold` | `SectionTitle`, `CardTitle` |
| Form section label | `text-xs font-semibold uppercase tracking-wider text-muted-foreground` | `FormSectionHeading` |
| Body text | `text-sm` | Most content |
| Secondary / meta | `text-xs text-muted-foreground` | Subtitles, counts |
| Sub-xs badge | `text-[10px]` | Count badges in `SubNav` |

---

### Spacing

Built on a 4px grid (Tailwind default). Canonical values:

| Context | Value |
|---------|-------|
| Content area padding | `p-6` |
| Card content | `p-4` (via `CardContent`) |
| Filter bar | `p-3` |
| Page-level vertical rhythm | `space-y-6` (always) |
| Form field gap | `space-y-3` |
| Inline gap (icon + label) | `gap-2` |

---

### Borders and Shadows

| Surface | Classes |
|---------|---------|
| Cards, tables, filter bars | `rounded-xl border bg-card shadow-sm` |
| Form sections | `rounded-lg` (slightly tighter) |
| Floating layers (dropdowns, modals) | `shadow-lg` (handled by shadcn primitives) |
| Base radius variable | `--radius: 0.625rem` |

The **"paper on gray" pattern**: the page body uses `bg-muted`; cards and tables float on top with `bg-card shadow-sm`. Never render content directly on the muted background without a card wrapper.

---

## Components

All admin components live in `src/components/admin/`. Import directly — no barrel files.

---

### StatusBadge

`src/components/admin/status-badge.tsx`

The canonical badge for any status or category value. Two modes:

**Map mode** — for category values with distinct colors:
```tsx
import { StatusBadge } from '@/components/admin/status-badge';
import { ACCOUNT_TYPE_STYLES } from '@/features/accounts/types';

<StatusBadge colorMap={ACCOUNT_TYPE_STYLES} value={account.type}>
  {account.type}
</StatusBadge>
```

**Boolean mode** — for active/inactive states:
```tsx
<StatusBadge positive={account.status === 'Actief'}>
  {account.status}
</StatusBadge>
// positive=true  → bg-primary/15 text-primary-action
// positive=false → bg-muted text-muted-foreground
```

**Props:**

| Prop | Type | Description |
|------|------|-------------|
| `children` | `ReactNode` | Badge label |
| `colorMap` | `Record<string, string>` | Map of value → Tailwind classes |
| `value` | `string` | Key to look up in `colorMap` |
| `positive` | `boolean` | Enables boolean mode (positive = brand, negative = muted) |
| `className` | `string` | Extra classes |

**Rules:**
- Every data table column with a status-like value must use `StatusBadge` — never render plain text.
- If `colorMap` has no entry for `value`, falls back to muted.
- `colorMap` and `positive` should not be combined — use one mode at a time.

---

### RouteErrorCard

`src/components/admin/route-error-card.tsx`

Used in every `error.tsx` file. Renders a centered card with an error message, the raw error in development, and a retry button.

```tsx
// src/app/admin/accounts/error.tsx
'use client';
import { RouteErrorCard } from '@/components/admin/route-error-card';

export default function AccountsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteErrorCard
      title="Fout bij laden van accounts"
      description="Er is een onverwachte fout opgetreden bij het laden van accounts."
      error={error}
      reset={reset}
    />
  );
}
```

**Props:**

| Prop | Type | Description |
|------|------|-------------|
| `title` | `string` | Card heading |
| `description` | `string` | Human-readable explanation |
| `error` | `Error & { digest?: string }` | Next.js error object |
| `reset` | `() => void` | Retry callback from Next.js error boundary |

---

### SectionTitle

`src/components/admin/section-title.tsx`

Used inside `<CardHeader>` for titled sections with an optional icon and action slot.

```tsx
import { SectionTitle } from '@/components/admin/section-title';
import { FileText } from 'lucide-react';

// With icon and action
<CardHeader>
  <SectionTitle
    icon={FileText}
    action={<Button size="sm"><Plus /> Toevoegen</Button>}
  >
    Contracten
  </SectionTitle>
</CardHeader>

// Title only
<CardHeader>
  <SectionTitle>Bedrijfsinformatie</SectionTitle>
</CardHeader>
```

**Props:**

| Prop | Type | Description |
|------|------|-------------|
| `icon` | `LucideIcon` | Optional icon left of title |
| `action` | `ReactNode` | Optional content right-aligned (buttons, badges) |
| `children` | `ReactNode` | Section label text |

Renders as `CardTitle` with `text-sm font-semibold`.

---

### FormSectionHeading

`src/components/admin/form-section-heading.tsx`

Uppercase divider heading inside forms. Renders `text-xs font-semibold uppercase tracking-wider text-muted-foreground`.

```tsx
import { FormSectionHeading } from '@/components/admin/form-section-heading';

<FormSectionHeading>Bedrijfsinformatie</FormSectionHeading>
```

**Props:** `children: ReactNode`

Use this for logical grouping without a tinted background. For a visually separated group with a background tint, use `FormSection` instead.

---

### FormSection

`src/components/admin/form-section.tsx`

A tinted, rounded form group with a section label and an optional action. Automatically sets input/select backgrounds to white (light) or `bg-background` (dark) to ensure legibility inside the tinted area.

```tsx
import { FormSection } from '@/components/admin/form-section';

<FormSection title="Indexering" color="amber">
  <Input name="index_pct" type="number" />
  <Select name="index_type">...</Select>
</FormSection>

<FormSection title="Contract" color="primary" action={<Button size="sm" variant="outline">Bewerk</Button>}>
  <Input name="start_date" type="date" />
</FormSection>
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | — | Section label (rendered as `FormSectionHeading`) |
| `color` | `'amber' \| 'blue' \| 'green' \| 'neutral' \| 'primary'` | `'neutral'` | Background tint |
| `action` | `ReactNode` | — | Optional right-aligned element in header |
| `children` | `ReactNode` | — | Form fields |

---

### ExternalLinkButton

`src/components/admin/external-link-button.tsx`

Inline link or button that always shows an `ExternalLink` icon. Renders `<a target="_blank">` when `href` is provided, `<button>` when `onClick` is provided.

```tsx
import { ExternalLinkButton } from '@/components/admin/external-link-button';

// Link mode
<ExternalLinkButton href="https://phpro.be">Bezoek website</ExternalLinkButton>

// Action mode
<ExternalLinkButton onClick={handleOpenDocument}>SOW bekijken</ExternalLinkButton>
```

**Props:**

| Prop | Type | Description |
|------|------|-------------|
| `href` | `string` | Renders as `<a>` with `target="_blank"` |
| `onClick` | `() => void` | Renders as `<button>` |
| `children` | `ReactNode` | Link label |
| `className` | `string` | Extra classes |

---

### DiffBadge

`src/components/admin/diff-badge.tsx`

Inline diff indicator. Green for positive values, red for negative. Returns `null` for zero — safe to render unconditionally.

```tsx
import { DiffBadge } from '@/components/admin/diff-badge';

<DiffBadge value={newRate - oldRate} format="currency" />
// renders: "+€5.00" in green, or "-€5.00" in red, or nothing
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `number` | — | Delta value |
| `format` | `'number' \| 'currency'` | `'number'` | Display format |
| `className` | `string` | — | Extra classes |

---

### ListPageToolbar

`src/components/admin/list-page-toolbar.tsx`

The horizontal bar between `PageHeader` and `DataTable`. Hosts `SubNav` tabs on the left and action buttons on the right. Returns `null` if both are empty.

```tsx
import { ListPageToolbar } from '@/components/admin/list-page-toolbar';

<ListPageToolbar
  tabs={[
    { key: 'all', label: 'Alle', count: total },
    { key: 'actief', label: 'Actief', icon: CheckCircle },
  ]}
  activeTab={activeTab}
  onTabSelect={setActiveTab}
  actions={
    <Button size="sm" onClick={() => setShowNew(true)}>
      <Plus /> Nieuw
    </Button>
  }
/>
```

For URL-based tab navigation, use `getTabHref` instead of `onTabSelect`:
```tsx
<ListPageToolbar
  tabs={tabs}
  activeTab={activeTab}
  getTabHref={(key) => `/admin/deals?tab=${key}`}
/>
```

**Props:**

| Prop | Type | Description |
|------|------|-------------|
| `tabs` | `SubNavItem[]` | Tab definitions (see `SubNav`) |
| `activeTab` | `string` | Key of the currently active tab |
| `onTabSelect` | `(key: string) => void` | Client-side tab switching |
| `getTabHref` | `(key: string) => string` | URL-based tab switching (renders `<Link>`) |
| `actions` | `ReactNode` | Buttons rendered on the right |

---

### EmptyState

`src/components/admin/empty-state.tsx`

Centered placeholder for zero-data views. Used inside tab panels and modal content areas.

```tsx
import { EmptyState } from '@/components/admin/empty-state';
import { Users } from 'lucide-react';

<EmptyState
  icon={Users}
  title="Geen contacten"
  description="Voeg een contact toe om te starten"
  action={{ label: 'Contact toevoegen', onClick: () => setShowModal(true) }}
/>
```

**Props:**

| Prop | Type | Description |
|------|------|-------------|
| `icon` | `LucideIcon` | Icon displayed above the title |
| `title` | `string` | Main message (required) |
| `description` | `string` | Optional secondary line |
| `action` | `{ label: string; onClick: () => void }` | Optional CTA button |

---

### PageHeader

`src/components/admin/page-header.tsx`

Top of every admin page. Renders breadcrumbs above the h1 title, with an optional actions slot on the right.

```tsx
import { PageHeader } from '@/components/admin/page-header';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Plus } from 'lucide-react';

<PageHeader
  title="Accounts"
  breadcrumbs={[
    { label: 'Admin', href: '/admin' },
    { label: 'Accounts' },          // last item has no href — renders as current page
  ]}
  actions={
    <Button size="sm" nativeButton={false} render={<Link href="/admin/accounts/new" />}>
      <Plus /> Nieuw Account
    </Button>
  }
/>
```

**Props:**

| Prop | Type | Description |
|------|------|-------------|
| `title` | `string` | Page h1 — `text-2xl font-bold tracking-tight` |
| `breadcrumbs` | `{ label: string; href?: string }[]` | Items without `href` render as current page |
| `actions` | `ReactNode` | Right-aligned buttons |

**Important:** Buttons that navigate via `<Link>` must use the base-ui `render` prop, not `asChild`:
```tsx
// Correct
<Button render={<Link href="..." />}>Label</Button>

// Wrong (does not work with base-ui Button)
<Button asChild><Link href="...">Label</Link></Button>
```

---

### DataTable

`src/components/admin/data-table.tsx`

Default export. Full-featured table with optional filter bar, column visibility, sortable headers, row actions, bulk actions, and pagination. Wraps in `rounded-xl border bg-card shadow-sm` — do not add a card wrapper around it.

```tsx
import DataTable from '@/components/admin/data-table';

<DataTable
  tableId="accounts"           // enables column visibility persistence via localStorage
  columns={accountColumns}
  data={data}
  pagination={{ page, pageSize: 25, total }}
  onPageChange={setPage}
  onRowClick={(row) => router.push(`/admin/accounts/${row.id}`)}
  rowActions={(row) => [
    { icon: Pencil, label: 'Bewerken', onClick: () => setEditId(row.id) },
    {
      icon: Trash2,
      label: 'Verwijderen',
      onClick: () => handleDelete(row.id),
      variant: 'destructive',
      confirm: {
        title: 'Account verwijderen?',
        description: 'Dit kan niet ongedaan worden gemaakt.',
      },
    },
  ]}
  filterBar={
    <div className="flex flex-wrap items-center gap-3">
      <Input placeholder="Zoeken..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-64" />
    </div>
  }
/>
```

**Props:**

| Prop | Type | Description |
|------|------|-------------|
| `tableId` | `string` | Enables column settings persistence |
| `columns` | `ColumnDef<T>[]` | TanStack Table column definitions |
| `data` | `T[]` | Row data |
| `pagination` | `{ page, pageSize, total }` | Shows pagination footer when `total > pageSize` |
| `onPageChange` | `(page: number) => void` | Page change callback |
| `filterBar` | `ReactNode` | Custom filter bar content (overrides auto-filters) |
| `filters` | `Record<string, string \| undefined>` | Auto-filter state (alternative to `filterBar`) |
| `onFilterChange` | `(filters) => void` | Called when auto-filters change |
| `filterOptions` | `Record<string, FilterOption[]>` | Dynamic options for auto-filter selects |
| `onRowClick` | `(row: T) => void` | Makes rows clickable (adds pointer cursor) |
| `rowActions` | `(row: T) => RowAction<T>[]` | Per-row icon buttons in a trailing column |
| `bulkActions` | `BulkAction[]` | Bulk action buttons shown when rows are selected |
| `loading` | `boolean` | Shows skeleton rows |
| `refreshing` | `boolean` | Dims table while data reloads |
| `initialSorting` | `SortingState` | Initial sort state |

**`RowAction<T>` shape:**
```ts
type RowAction<T> = {
  icon: LucideIcon;
  label: string;
  onClick: (row: T) => void;
  variant?: 'ghost' | 'destructive';
  confirm?: { title: string; description: string };
};
```

When `confirm` is set, clicking the action opens a `ConfirmDialog` before `onClick` fires.

#### DataTable Filter Rules

Every DataTable **must** have at minimum:
1. **A search bar** — for the entity's primary string column (name, title, email, subject)
2. **Exclusive pills** — for the entity's primary categorical column (≤5 static options)

Filter layout (rendered by `DataTableFilters`):
```
Row 1: [🔍 Search] [Dropdown] [Dropdown] ... [Dropdown]
Row 2: [Alle] [Option1] [Option2] [Option3]              ← pills always below
```

| Criteria | Filter type | Column meta |
|----------|------------|-------------|
| Free text search on primary string field | Search input | `type: 'search'` |
| ≤5 static options, pick one | **Pills** | `type: 'pills'`, `allLabel: 'Alle'` |
| >5 options, or dynamic options | Select dropdown | `type: 'select'` |
| Searchable list (accounts, users) | Combobox | `ComboboxFilter` in `filterBar` |

Configuring pills in column meta:
```tsx
{
  id: 'type',
  meta: {
    label: 'Type',
    filter: {
      type: 'pills',
      options: [
        { value: 'Klant', label: 'Klant' },
        { value: 'Prospect', label: 'Prospect' },
        { value: 'Partner', label: 'Partner' },
      ],
      allLabel: 'Alle',
    },
  },
  header: 'Type',
  cell: ...
}
```

**Rules:**
- Pills are always **exclusive** (one active at a time + "Alle" to clear)
- For multi-select status filtering (e.g. consultants), use `FilterPill` components in a manual `filterBar`
- Never put CTA buttons inside the filter bar — use `ListPageToolbar` instead
- Every pills filter must include an "Alle" option via `allLabel`

---

### Modal

`src/components/admin/modal.tsx`

Thin wrapper around shadcn `Dialog`. Use for all create/edit/detail modals.

```tsx
import { Modal } from '@/components/admin/modal';

<Modal
  open={isOpen}
  onClose={() => setIsOpen(false)}
  title="Contact bewerken"
  size="wide"
>
  <ContactForm contactId={id} onClose={() => setIsOpen(false)} />
</Modal>
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `open` | `boolean` | — | Controls visibility |
| `onClose` | `() => void` | — | Called on close / backdrop click |
| `title` | `string` | — | Dialog title |
| `children` | `ReactNode` | — | Dialog body |
| `size` | `'default' \| 'wide' \| 'extra-wide'` | `'default'` | Max-width: 32rem / 42rem / 56rem |

**Important — remount on entity change.** Base UI's `Input` tracks `defaultValue` as uncontrolled state. If a modal stays mounted and receives a new entity ID, fields show stale values.

```tsx
// Correct — guard + key forces clean remount
{editId && (
  <Modal key={editId} open title="Bewerken" onClose={() => setEditId(null)}>
    <EditForm id={editId} />
  </Modal>
)}

// Wrong — stale state when switching between entities
<Modal open={!!editId} title="Bewerken" onClose={() => setEditId(null)}>
  <EditForm id={editId} />
</Modal>
```

---

### ConfirmDialog

`src/components/admin/confirm-dialog.tsx`

Destructive action confirmation. Can be used in two modes: **controlled** (from `DataTable` row action with `confirm`) or **trigger-based** (wraps a button).

```tsx
import { ConfirmDialog } from '@/components/admin/confirm-dialog';

// Trigger mode — wraps a button
<ConfirmDialog
  title="Account verwijderen?"
  description="Dit kan niet ongedaan worden gemaakt."
  onConfirm={() => handleDelete(id)}
  trigger={<Button variant="destructive" size="sm">Verwijderen</Button>}
/>

// Controlled mode
<ConfirmDialog
  title="Consultant archiveren?"
  description="De consultant is daarna niet meer zichtbaar."
  onConfirm={handleArchive}
  open={confirmOpen}
  onOpenChange={setConfirmOpen}
/>
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | — | Alert title |
| `description` | `string` | — | Explanatory text |
| `onConfirm` | `() => void` | — | Called on confirm |
| `variant` | `'default' \| 'destructive'` | `'destructive'` | Styles the confirm button |
| `trigger` | `ReactElement` | — | Trigger button (trigger mode) |
| `open` | `boolean` | — | Controlled open state |
| `onOpenChange` | `(open: boolean) => void` | — | Controlled state setter |

---

### SubNav

`src/components/admin/sub-nav.tsx`

Pill-style tab navigation. Used directly by `ListPageToolbar`, and also used as a standalone sub-navigation within detail page layouts.

```tsx
import { SubNav } from '@/components/admin/sub-nav';
import { Building, Users } from 'lucide-react';

const tabs = [
  { key: 'overview', label: 'Overzicht', icon: Building },
  { key: 'contacts', label: 'Contacten', icon: Users, count: 12 },
];

// Client-side switching
<SubNav items={tabs} activeKey={activeTab} onSelect={setActiveTab} />

// URL-based navigation (renders <Link>)
<SubNav items={tabs} activeKey={activeTab} getHref={(key) => `/admin/accounts/${id}/${key}`} />
```

**`SubNavItem` shape:**

| Field | Type | Description |
|-------|------|-------------|
| `key` | `string` | Unique identifier |
| `label` | `string` | Visible label |
| `icon` | `LucideIcon` | Optional icon |
| `count` | `number` | Badge count (hidden when `0`) |

Active item style: `bg-primary/10 text-primary-action`. Count badge: `bg-primary/15 text-primary-action text-[10px]`.

---

### FilterBar

`src/components/admin/filter-bar.tsx`

White card container for filter controls. Always use this — never put raw filter inputs on the muted background.

```tsx
import { FilterBar } from '@/components/admin/filter-bar';

<FilterBar>
  <div className="flex flex-wrap items-center gap-3">
    <Input placeholder="Zoeken..." />
    <Select>...</Select>
  </div>
</FilterBar>
```

`DataTable` wraps its auto-generated filter bar in `FilterBar` automatically. Use `FilterBar` explicitly only when building a custom `filterBar` prop outside of `DataTable`.

---

### InfoRow

`src/components/admin/info-row.tsx`

Labeled value row for detail cards. Used in `AccountOverviewTab`, contact views, and any read-only detail panel.

```tsx
import { InfoRow } from '@/components/admin/info-row';
import { Globe } from 'lucide-react';

<InfoRow label="Type" value={account.type} />
<InfoRow label="Website" href="https://phpro.be" value="phpro.be" />
<InfoRow label="BTW" value={account.vat_number} mono />
<InfoRow icon={Globe} label="Land" value={account.country} />

// children override value for custom content
<InfoRow label="Status">
  <StatusBadge positive={isActive}>{status}</StatusBadge>
</InfoRow>
```

**Props:**

| Prop | Type | Description |
|------|------|-------------|
| `label` | `string` | Left column label (fixed `w-28`) |
| `value` | `ReactNode` | Value content |
| `children` | `ReactNode` | Overrides `value` when provided |
| `icon` | `LucideIcon` | Optional icon before label |
| `href` | `string` | Wraps value in external link |
| `mono` | `boolean` | Renders value in monospace `text-xs` (for IDs, codes) |

When `value` and `children` are both absent, renders an em-dash placeholder.

---

### StatCard

`src/components/admin/stat-card.tsx`

KPI card for dashboard and list page headers. Wraps `Card` / `CardContent`.

```tsx
import { StatCard } from '@/components/admin/stat-card';
import { Users } from 'lucide-react';

<StatCard title="Actieve consultants" value={42} subtitle="op dit moment" icon={Users} />

<StatCard
  title="Max maandomzet"
  value="€124.800"
  trend={{ value: 12, label: 'vs vorige maand', direction: 'up' }}
/>
```

**Props:**

| Prop | Type | Description |
|------|------|-------------|
| `title` | `string` | Card heading (`text-sm text-muted-foreground`) |
| `value` | `string \| number` | Main KPI value (`text-2xl font-bold`) |
| `subtitle` | `string` | Optional line below value |
| `icon` | `LucideIcon` | Optional icon top-right |
| `trend` | `{ value: number; label: string; direction: 'up' \| 'down' }` | Optional trend line |

---

### Avatar

`src/components/admin/avatar.tsx`

Display-only avatar. Fetches a signed URL from the `avatars` Supabase storage bucket with a module-level in-memory cache (TTL ~58 min). Falls back to initials when no path is set or the image fails to load.

```tsx
import { Avatar } from '@/components/admin/avatar';

// Person (round)
<Avatar path={contact.avatar_path} fallback="JD" size="sm" round />

// Company (rounded square)
<Avatar path={account.logo_path} fallback="PH" size="md" round={false} />
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `path` | `string \| null` | — | Storage path relative to `avatars` bucket |
| `fallback` | `string` | — | Initials shown when no image |
| `size` | `'xs' \| 'sm' \| 'md'` | `'sm'` | `xs=24px`, `sm=32px`, `md=40px` |
| `round` | `boolean` | `true` | `true` = `rounded-full`, `false` = `rounded-md` |

Storage path convention: `contacts/{id}/avatar.{ext}` or `accounts/{id}/avatar.{ext}`.

---

### AvatarUpload

`src/components/admin/avatar-upload.tsx`

Clickable avatar with camera overlay for uploading. Use in edit forms and detail pages where users can change the image. Validates: JPG/PNG/WebP only, max 2MB.

```tsx
import { AvatarUpload } from '@/components/admin/avatar-upload';

<AvatarUpload
  currentPath={contact.avatar_path}
  fallback="JD"
  storagePath={`contacts/${contact.id}`}
  onUploaded={(path) => setValue('avatar_path', path)}
  size="md"
  round
/>
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `currentPath` | `string \| null` | — | Existing storage path |
| `fallback` | `string` | — | Initials fallback |
| `storagePath` | `string` | — | Path prefix, e.g. `contacts/abc-123` |
| `onUploaded` | `(path: string) => void` | — | Called with the new storage path |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | `sm=40px`, `md=48px`, `lg=64px` |
| `round` | `boolean` | `true` | Shape |

Uploads to `avatars` bucket at `{storagePath}/avatar.{ext}` with `upsert: true`.

---

### TogglePill

`src/components/admin/toggle-pill.tsx`

Toggle button styled as a pill. For boolean flags submitted via `<form action={...}>`. Writes an `<input type="hidden">` with value `'on'` or `''` for FormData compatibility.

```tsx
import { TogglePill } from '@/components/admin/toggle-pill';
import { Star, UtensilsCrossed } from 'lucide-react';

<TogglePill name="is_steerco" label="Steerco" icon={Star} defaultActive={contact.is_steerco} />
<TogglePill name="invite_dinner" label="Diner" icon={UtensilsCrossed} defaultActive={false} />
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `name` | `string` | — | Form field name |
| `label` | `string` | — | Pill label |
| `icon` | `LucideIcon` | — | Optional icon |
| `defaultActive` | `boolean` | `false` | Initial state |

Active: `bg-primary text-primary-foreground border-primary`. Inactive: `bg-background text-muted-foreground border-border`.

Use `TogglePill` for: feature flags, role tags, boolean form fields.
Use a `Checkbox` for: terms acceptance, multi-select lists, settings toggles where a label is adjacent.

---

### FilterPill

`src/components/admin/filter-pill.tsx`

Stateless toggle pill for filter UIs. Unlike `TogglePill`, this is a controlled component — the parent owns the state.

```tsx
import { FilterPill } from '@/components/admin/filter-pill';

{statusOptions.map((opt) => (
  <FilterPill
    key={opt.value}
    label={opt.label}
    active={selectedStatuses.includes(opt.value)}
    onClick={() => toggleStatus(opt.value)}
  />
))}
```

**Props:**

| Prop | Type | Description |
|------|------|-------------|
| `label` | `string` | Pill label |
| `active` | `boolean` | Filled primary when true, muted when false |
| `onClick` | `() => void` | Toggle callback |

---

## Page Templates

### List Page

The canonical list page structure:

```
┌──────────────────────────────────────────────────────┐
│ PageHeader (breadcrumb + title + primary action)     │
├──────────────────────────────────────────────────────┤
│ ListPageToolbar                                      │
│   [SubNav tabs]                    [Action buttons]  │
├──────────────────────────────────────────────────────┤
│ DataTable                                            │
│   FilterBar: [Search]  [Selects]  [Pills]            │
│   Table: ☐ Col1↕ Col2↕ ...         [Row actions]    │
│   Pagination                                         │
└──────────────────────────────────────────────────────┘
```

**Server page (`src/app/admin/items/page.tsx`):**
```tsx
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { PageHeader } from '@/components/admin/page-header';
import { Button } from '@/components/ui/button';
import { getItems } from '@/features/items/queries/get-items';
import { ItemList } from '@/features/items/components/item-list';

export default async function ItemsPage() {
  const { data, count } = await getItems();
  return (
    <div className="space-y-6">
      <PageHeader
        title="Items"
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Items' },
        ]}
        actions={
          <Button size="sm" nativeButton={false} render={<Link href="/admin/items/new" />}>
            <Plus /> Nieuw Item
          </Button>
        }
      />
      <ItemList initialData={data} initialCount={count} />
    </div>
  );
}
```

**Loading skeleton (`src/app/admin/items/loading.tsx`):**
```tsx
import { Skeleton } from '@/components/ui/skeleton';

export default function ItemsLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="flex gap-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-32" />
      </div>
      <Skeleton className="h-[600px] w-full" />
    </div>
  );
}
```

**Error boundary (`src/app/admin/items/error.tsx`):**
```tsx
'use client';
import { RouteErrorCard } from '@/components/admin/route-error-card';

export default function ItemsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteErrorCard
      title="Fout bij laden van items"
      description="Er is een onverwachte fout opgetreden."
      error={error}
      reset={reset}
    />
  );
}
```

**Client list component (`src/features/items/components/item-list.tsx`):**
```tsx
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FilterPill } from '@/components/admin/filter-pill';
import { ListPageToolbar } from '@/components/admin/list-page-toolbar';
import DataTable from '@/components/admin/data-table';
import { useEntity } from '@/lib/hooks/use-entity';
import { itemColumns } from '../columns';
import type { Item } from '../types';
import { escapeSearch } from '@/lib/utils/escape-search';
import dynamic from 'next/dynamic';

const ItemModal = dynamic(() => import('./item-modal').then((m) => ({ default: m.ItemModal })));

type Props = {
  initialData: Item[];
  initialCount: number;
};

const PAGE_SIZE = 25;

export function ItemList({ initialData, initialCount }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showNew, setShowNew] = useState(false);

  const { data, total, fetchList, refreshing } = useEntity<Item>({
    table: 'items',
    pageSize: PAGE_SIZE,
    initialData,
    initialCount,
  });

  const load = useCallback(() => {
    fetchList({
      page,
      sort: { column: 'name', direction: 'asc' },
      orFilter: search
        ? `name.ilike.%${escapeSearch(search)}%`
        : undefined,
    });
  }, [fetchList, page, search]);

  // Skip load on initial render — initialData already loaded by server
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) { isInitialMount.current = false; return; }
    load();
  }, [load]);

  useEffect(() => { setPage(1); }, [search]);

  return (
    <>
      <div className="space-y-6">
        <ListPageToolbar
          actions={
            <Button size="sm" onClick={() => setShowNew(true)}>
              <Plus /> Nieuw
            </Button>
          }
        />

        <DataTable
          tableId="items"
          columns={itemColumns}
          data={data}
          refreshing={refreshing}
          pagination={{ page, pageSize: PAGE_SIZE, total }}
          onPageChange={setPage}
          onRowClick={(row) => router.push(`/admin/items/${row.id}`)}
          filterBar={
            <Input
              placeholder="Zoeken..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64"
            />
          }
        />
      </div>

      {showNew && (
        <ItemModal
          key="new"
          open
          onClose={() => { setShowNew(false); load(); router.refresh(); }}
        />
      )}
    </>
  );
}
```

---

### Detail Page with Tabs

Used for entities that need sub-sections (accounts, deals, contacts). The tab navigation and header live in the route `layout.tsx`; each tab is a separate `page.tsx`.

**Layout (`src/app/admin/items/[id]/layout.tsx`):**
```tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/admin/page-header';
import { Button } from '@/components/ui/button';
import { Pencil } from 'lucide-react';
import { getItem } from '@/features/items/queries/get-item';
import { ItemSubNav } from '@/features/items/components/item-sub-nav';

type Props = { params: Promise<{ id: string }>; children: React.ReactNode };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const item = await getItem(id);
  return { title: item?.name ?? 'Item' };
}

export default async function ItemDetailLayout({ params, children }: Props) {
  const { id } = await params;
  const item = await getItem(id);
  if (!item) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title={item.name}
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Items', href: '/admin/items' },
          { label: item.name },
        ]}
        actions={
          <Button nativeButton={false} render={<Link href={`/admin/items/${id}/edit`} />}>
            <Pencil /> Bewerken
          </Button>
        }
      />
      <ItemSubNav itemId={id} />
      {children}
    </div>
  );
}
```

**Tab page (`src/app/admin/items/[id]/page.tsx`):**
```tsx
import { notFound } from 'next/navigation';
import { getItem } from '@/features/items/queries/get-item';
import { ItemOverviewTab } from '@/features/items/components/item-overview-tab';

export default async function ItemOverviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await getItem(id);
  if (!item) notFound();
  return <ItemOverviewTab item={item} />;
}
```

Each tab must have its own `page.tsx`. The sub-nav uses `getHref` for URL-based navigation so tabs are bookmarkable.

---

### Narrow Form Page

For create/edit pages where the form is the primary content. Use a centered max-width container.

```tsx
// src/app/admin/items/new/page.tsx
import { PageHeader } from '@/components/admin/page-header';
import { ItemCreatePageClient } from '@/features/items/components/item-create-page-client';

export default async function NewItemPage() {
  // Load any reference data the form needs
  const options = await getReferenceOptions('items');
  return (
    <div className="space-y-6">
      <PageHeader
        title="Nieuw Item"
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Items', href: '/admin/items' },
          { label: 'Nieuw' },
        ]}
      />
      <div className="max-w-2xl">
        <ItemCreatePageClient options={options} />
      </div>
    </div>
  );
}
```

---

## Server Action Pattern

All mutations use `ActionResult<T>` from `@/lib/action-result`. Never throw from server actions.

```ts
// src/features/items/actions/create-item.ts
'use server';

import { revalidatePath } from 'next/cache';
import { createServerClient } from '@/lib/supabase/server';
import { ok, err, type ActionResult } from '@/lib/action-result';
import { itemFormSchema, type ItemFormValues } from '../types';

export async function createItem(values: ItemFormValues): Promise<ActionResult<{ id: string }>> {
  const parsed = itemFormSchema.safeParse(values);
  if (!parsed.success) {
    return err(parsed.error.flatten().fieldErrors);
  }

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('items')
    .insert(parsed.data)
    .select('id')
    .single();

  if (error) return err(error.message);

  revalidatePath('/admin/items');
  return ok(data);
}
```

**Calling the action from a form:**
```tsx
'use client';
import { useActionState } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { SubmitButton } from '@/components/ui/submit-button';
import { createItem } from '../actions/create-item';
import { Save } from 'lucide-react';

export function ItemForm() {
  const router = useRouter();

  const [, formAction] = useActionState(async (_prev: null, formData: FormData) => {
    const values = { name: formData.get('name') as string };
    const result = await createItem(values);
    if (result.error) {
      toast.error(typeof result.error === 'string' ? result.error : 'Validatiefout');
      return null;
    }
    toast.success('Item aangemaakt');
    router.push(`/admin/items/${result.data!.id}`);
    return null;
  }, null);

  return (
    <form action={formAction} className="space-y-4">
      <input name="name" />
      <SubmitButton icon={<Save />}>Opslaan</SubmitButton>
    </form>
  );
}
```

**`ActionResult<T>` shape:**
```ts
type ActionResult<T = void> =
  | { success: true; data?: T; error?: never }
  | { error: string | Record<string, string[]>; success?: never; data?: never };
```

---

## Query Pattern

All server queries are wrapped in `React.cache()` and use `createServerClient()`.

```ts
// src/features/items/queries/get-item.ts
import { cache } from 'react';
import { createServerClient } from '@/lib/supabase/server';

export const getItem = cache(async (id: string) => {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from('items')
    .select('*')
    .eq('id', id)
    .single();
  return data;
});
```

`React.cache()` deduplicates calls within the same request — multiple server components requesting the same entity only hit the database once.

---

## Shared Style Constants

Define badge style maps in `features/<name>/types.ts`, not in components. This keeps badge colors consistent across all uses of a given entity.

```ts
// features/accounts/types.ts
export const ACCOUNT_TYPE_STYLES: Record<string, string> = {
  Klant:    'bg-green-100 text-green-700',
  Prospect: 'bg-blue-100 text-blue-700',
  Partner:  'bg-orange-100 text-orange-700',
};

// features/consultants/types.ts
export const CONSULTANT_STATUS_STYLES: Record<ConsultantStatus, string> = {
  bench:     'bg-orange-100 text-orange-700',
  actief:    'bg-green-100 text-green-700',
  stopgezet: 'bg-muted text-muted-foreground',
};

export const CONSULTANT_STATUS_LABELS: Record<ConsultantStatus, string> = {
  bench:     'Bench',
  actief:    'Actief',
  stopgezet: 'Stopgezet',
};

// features/communications/types.ts — icon + colors bundled together
export const COMMUNICATION_TYPE_CONFIG: Record<string, {
  icon: LucideIcon;
  bg: string;
  color: string;
  label: string;
}> = {
  email:   { icon: Mail,      bg: 'bg-blue-50 dark:bg-blue-950',   color: 'text-blue-600 dark:text-blue-400',   label: 'E-mail' },
  note:    { icon: FileText,  bg: 'bg-amber-50 dark:bg-amber-950', color: 'text-amber-600 dark:text-amber-400', label: 'Notitie' },
  meeting: { icon: Users,     bg: 'bg-green-50 dark:bg-green-950', color: 'text-green-600 dark:text-green-400', label: 'Vergadering' },
  call:    { icon: Phone,     bg: 'bg-purple-50 dark:bg-purple-950', color: 'text-purple-600 dark:text-purple-400', label: 'Call' },
};
```

---

## Conventions

### Naming

| Item | Convention | Example |
|------|-----------|---------|
| Files | kebab-case | `account-list.tsx`, `get-accounts.ts` |
| Components | PascalCase named export | `export function AccountList` |
| Page components | default export | `export default async function AccountsPage()` |
| Hooks | `use` prefix, camelCase | `useEntity`, `useBrandTheme` |
| Server actions | camelCase | `createAccount`, `updateContact` |
| Event handlers | `handle` prefix | `handleDelete`, `handleModalClose` |
| Route params | singular `[id]` | `admin/accounts/[id]` |

All user-facing text is in Dutch. Documentation and code comments are in English.

### File Organization

```
src/
├── app/admin/<name>/
│   ├── page.tsx          # Server component — fetches, renders feature component
│   ├── loading.tsx       # Skeleton matching page layout
│   └── error.tsx         # RouteErrorCard
├── features/<name>/
│   ├── actions/          # Server actions — 'use server', use ActionResult
│   ├── queries/          # Server queries — React.cache(), createServerClient()
│   ├── components/       # Client components — 'use client'
│   ├── types.ts          # Zod schemas, DB row types, badge style maps
│   └── columns.ts        # TanStack Table column defs
├── components/
│   ├── admin/            # Shared admin UI (documented above)
│   ├── layout/           # Sidebar, topbar, brand switcher
│   └── ui/               # shadcn/ui primitives
└── lib/
    ├── hooks/            # Shared hooks (useEntity, useRealtime, etc.)
    ├── action-result.ts  # ok() / err() / ActionResult<T>
    └── supabase/         # client.ts, server.ts, admin.ts
```

**Rule:** If a component is only used by one feature, it goes in `src/features/<name>/components/` — not in `src/components/admin/`.

### Every Route Must Have

```
src/app/admin/<name>/
├── page.tsx     — async server component, calls queries, passes data as props
├── loading.tsx  — Skeleton UI, no logic
└── error.tsx    — 'use client', uses RouteErrorCard
```

Detail routes (`[id]/`) should use a `layout.tsx` for shared header + sub-nav, with each tab as a separate `page.tsx`.

### Badge Color Rules

| Scenario | Component / style |
|----------|------------------|
| Active / positive boolean | `<StatusBadge positive={true}>` → `bg-primary/15 text-primary-action` |
| Inactive / negative boolean | `<StatusBadge positive={false}>` → `bg-muted text-muted-foreground` |
| Category with fixed colors | `<StatusBadge colorMap={MAP} value={val}>` → hardcoded Tailwind classes |
| Count badge in SubNav | Inline: `bg-primary/15 text-primary-action text-[10px]` |

Never render plain text where a badge is semantically appropriate. Every status-like value in a data table must use `StatusBadge`.

### Interactive State Classes

Always use semantic tokens — never hardcode brand colors in component style attributes.

| Element | Active | Hover |
|---------|--------|-------|
| Sidebar item | `bg-sidebar-accent text-sidebar-accent-foreground` | same |
| Table row action (default) | — | `hover:text-primary-action hover:bg-primary/10` |
| Table row action (destructive) | — | `hover:text-destructive hover:bg-destructive/10` |
| SubNav tab | `bg-primary/10 text-primary-action` | `hover:bg-muted/50 hover:text-foreground` |
| Primary button | `bg-primary text-primary-foreground` | via shadcn |
| Toggle active | `bg-primary text-primary-foreground` | — |

### Buttons

All buttons use the shadcn `<Button>` component. **Never hand-roll button styles** with raw `className` on `<Link>` or `<a>`.

| Context | Variant | Size | Example |
|---------|---------|------|---------|
| **Primary action** (add, create, save) | `default` | `sm` | `<Button size="sm"><Plus /> Nieuw Account</Button>` |
| **Page-level edit** (Bewerken in page header) | `default` | default | `<Button render={<Link href="..." />}><Pencil /> Bewerken</Button>` |
| **Secondary action** (edit, filter, simulate) | `outline` | `sm` | `<Button variant="outline" size="sm"><Pencil /> Bewerken</Button>` |
| **Empty state CTA** | `outline` | default | `<Button variant="outline"><Plus /> Consultant koppelen</Button>` |
| **Destructive** (delete, stop) | `destructive` | — | `<Button variant="destructive">Stopzetten</Button>` |
| **Modal cancel** | `outline` | — | `<Button variant="outline">Annuleren</Button>` |
| **Modal submit** | `default` | — | `<Button>Opslaan</Button>` |
| **Ghost** (icon-only, toolbar) | `ghost` | `icon` | `<Button variant="ghost" size="icon"><Pencil /></Button>` |

**Rules:**
- Primary actions always include a Lucide icon before the label
- One primary action per section/page header (the most important action)
- Page header links MUST use the `render` prop: `<Button render={<Link href="..." />}>` (base-ui, not asChild)
- Do NOT set explicit `className` on SVG icons inside Buttons — the Button handles sizing via `[&_svg]` selectors
- Save/submit buttons use the `Save` icon from lucide-react
- All button text is in Dutch

### Icons

- Use Lucide icons (`lucide-react`), never emojis in UI components
- Icon size in pills/badges: `h-3.5 w-3.5` (or `h-3 w-3` inside Badge with `mr-1`)
- Icon size in buttons: `h-4 w-4`

### Heavy Component Loading

Modals, editors, and other components not needed on initial paint must use `next/dynamic`:

```tsx
const ItemModal = dynamic(
  () => import('./item-modal').then((m) => ({ default: m.ItemModal })),
  { ssr: false },
);
```

### Select Triggers — Always Show Labels

Base UI's `SelectValue` shows raw UUIDs when items are not mounted. Always look up the label explicitly:

```tsx
// Correct
<SelectTrigger>
  {users.find((u) => u.id === ownerId)?.name ?? 'Selecteer...'}
</SelectTrigger>

// Wrong — will show UUID before first open
<SelectTrigger><SelectValue placeholder="Selecteer..." /></SelectTrigger>
```

### Zod ID Validation

Never use `z.string().uuid()` for ID fields. Fixture data uses non-RFC-compliant UUIDs that Zod rejects.

```ts
// Correct
owner_id: z.string().min(1, 'Eigenaar is verplicht')

// Wrong — breaks with fixture data
owner_id: z.string().uuid()
```
