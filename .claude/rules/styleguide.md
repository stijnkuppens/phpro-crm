# UI Style Guide

## Immersive Layout

The admin layout uses a **"paper on gray" pattern** for visual depth:

- **Main content area** has `bg-muted` — a tinted background that varies by brand theme
- **Cards, tables, and filter bars** use `bg-card rounded-xl border shadow-sm` to float on top
- **Sidebar and topbar** remain on `bg-background` (white/dark) with `border-b`/`border-r`

**Never** render content directly on the muted background without a card wrapper. Lists, forms, and detail views should always sit inside a card-like container.

## Filter Bar

**Always wrap filter controls in `<FilterBar>`** — never render bare flex containers for filters.

- Component: `src/components/admin/filter-bar.tsx`
- Renders a white card with `rounded-xl border shadow-sm bg-card p-3`
- Provides visual separation from the muted page background

```tsx
import { FilterBar } from '@/components/admin/filter-bar';

<FilterBar>
  <div className="flex flex-wrap items-center gap-3">
    <Input placeholder="Zoeken..." />
    <Select>...</Select>
  </div>
</FilterBar>
```

## Data Table Container

The `DataTable` component wraps its table in `rounded-xl border bg-card shadow-sm`. Do not add extra card wrappers around `<DataTable>` — it is already styled as a card.

## Brand Theming

The app supports two brand themes: **PHPro** and **25Carat**. Themes are applied via `data-brand` attribute on `<html>` and controlled by:

- Hook: `src/lib/hooks/use-brand-theme.ts` (`useBrandTheme`) — dispatches `CustomEvent` so all instances sync
- Switcher UI: `src/components/layout/brand-switcher.tsx` (in topbar)
- CSS variables: `src/app/globals.css` — scoped under `[data-brand="phpro"]` and `[data-brand="25carat"]`
- Sidebar logo: switches between `public/logos/phpro.svg` and `public/logos/25carat-wordmark.svg`

### PHPro Theme
- **Primary**: Vibrant lime green (`#bdd431`) — buttons, active states, focus rings, badges, toggle active state
- **Primary action**: Dark olive green (`#7a8a1e`) — text-on-white contexts (icon hover, badge text)
- **Primary foreground**: Dark/black text on green backgrounds
- **Accent**: Light green tint for hover states (sidebar, menu items, dropdowns)
- **Muted**: Light gray page background
- Inspired by [phpro.be](https://www.phpro.be/nl) — green + white + black

### 25Carat Theme
- **Primary**: Rich gold (`#C5A053`) — buttons, active states, focus rings, badges
- **Primary action**: Dark bronze (`#96782e`) — text-on-white contexts (icon hover, badge text)
- **Primary foreground**: White text on gold backgrounds
- **Accent**: Light gold tint for hover states
- **Muted**: Warm beige (`#f9f6ee`) page background
- Inspired by [25carat.be](https://25carat.be/) — gold + black + white + beige

### Theme-Aware Component Rules

All interactive states must use semantic CSS variables (not hardcoded colors):

| Element | Active/Selected | Hover | Focus |
|---------|----------------|-------|-------|
| Sidebar menu item | `bg-sidebar-accent text-sidebar-accent-foreground` | `hover:bg-sidebar-accent` | `ring-sidebar-ring` |
| Primary button | `bg-primary text-primary-foreground` | auto via shadcn | `ring-ring` |
| Toggle/pill active | `bg-primary text-primary-foreground` | — | `ring-ring` |
| Badge (brand) | `bg-primary/15 text-primary-action` | — | — |
| Badge (inactive) | `bg-muted text-muted-foreground` | — | — |
| Focus ring | `outline-ring/50` (global base rule) | — | `ring-ring` |
| Table row hover | `hover:bg-muted/50` | — | — |
| Table row action icons | `text-muted-foreground` | `hover:text-primary-action hover:bg-primary/10` | — |
| Table row action (destructive) | `text-muted-foreground` | `hover:text-destructive hover:bg-destructive/10` | — |
| Dropdown item hover | `bg-accent text-accent-foreground` | — | — |

**Never use hardcoded colors** like `bg-green-500`, `text-amber-600`, or `bg-indigo-600` for interactive states. Always use the semantic variables so both brand themes work correctly.

### Badge Color Rules

Badges in data tables and detail views follow these rules:

| Badge type | Style | Example |
|-----------|-------|---------|
| **Brand/positive** | `bg-primary/15 text-primary-action border-0` | Actief, Ja, "3 actief", Steerco |
| **Inactive/negative** | `bg-muted text-muted-foreground border-0` | Inactief, Nee, Geen |
| **Category (semantic)** | Hardcoded per-value colors | Klant=green, Prospect=blue, Partner=orange |
| **With icon** | Add Lucide icon `h-3 w-3 mr-1` inside badge | Role badges, relationship badges |

**Category badges** (Type column) use hardcoded colors because they represent distinct data categories that need visual differentiation:
```tsx
const styles: Record<string, string> = {
  Klant: 'bg-green-100 text-green-700',
  Prospect: 'bg-blue-100 text-blue-700',
  Partner: 'bg-orange-100 text-orange-700',
};
```

**Boolean badges** (Status, Raamcontract, SLA, Consultants) use brand colors:
```tsx
// Positive
<span className="bg-primary/15 text-primary-action ...">Actief</span>
// Negative
<span className="bg-muted text-muted-foreground ...">Nee</span>
```

**All data table columns that show a value MUST use badge styling** for visual consistency. Never render plain text for status-like values — use the badge pattern above.

## Avatars

Two avatar components exist for different contexts:

### Display-only: `Avatar`
- Component: `src/components/admin/avatar.tsx`
- Use in data tables, lists, and read-only contexts
- Props: `path` (storage path), `fallback` (initials), `size` (xs/sm/md), `round` (true for people, false for companies)
- Fetches signed URL from `avatars` storage bucket

### Uploadable: `AvatarUpload`
- Component: `src/components/admin/avatar-upload.tsx`
- Use in detail views and modals where the user can change the image
- Shows camera icon overlay on hover
- Uploads to `avatars` bucket, calls `onUploaded` with storage path
- Validates: JPG/PNG/WebP only, max 2MB

**Rules:**
- `round={true}` for people (contacts, employees) — circular
- `round={false}` for companies (accounts) — rounded square
- Fallback is always initials derived from the entity name
- Storage path pattern: `contacts/{id}/avatar.{ext}` or `accounts/{id}/avatar.{ext}`

## Toggle Pills over Checkboxes

For boolean toggles that represent **tags, roles, or feature flags** (e.g. Steerco, Diner, Event, Gift, Kinderen), use `TogglePill` instead of Checkbox.

- Component: `src/components/admin/toggle-pill.tsx`
- Props: `name`, `label`, `icon` (LucideIcon), `defaultActive`
- Renders a clickable pill/badge: filled primary when active, outlined muted when inactive
- Submits via hidden `<input>` with value `'on'` or `''` for FormData compatibility

**Use TogglePill for:** status flags, category tags, relationship badges, boolean feature toggles
**Use Checkbox for:** terms acceptance, single boolean fields in settings, multi-select lists

```tsx
import { TogglePill } from '@/components/admin/toggle-pill';
import { Star, UtensilsCrossed } from 'lucide-react';

<TogglePill name="is_steerco" label="Steerco" icon={Star} defaultActive={false} />
<TogglePill name="invite_dinner" label="Diner" icon={UtensilsCrossed} defaultActive={false} />
```

## Buttons

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
- Secondary actions include an icon when space allows
- One primary action per section/page header (the most important action)
- Page header links that look like buttons MUST use the `render` prop: `<Button render={<Link href="..." />}>...</Button>` (base-ui composes via render prop, not asChild)
- Do NOT set explicit `className` on SVG icons inside Buttons — the Button handles sizing via `[&_svg]` selectors
- Save/submit buttons use the `Save` icon (floppy disk) from lucide-react
- All button text is in Dutch

## Icons

- Use Lucide icons (`lucide-react`), never emojis in UI components
- Icon size in pills/badges: `h-3.5 w-3.5` (or `h-3 w-3` inside Badge with `mr-1`)
- Icon size in buttons: `h-4 w-4`
