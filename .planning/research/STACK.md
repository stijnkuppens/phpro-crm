# Stack Research

**Domain:** CRM + consultancy staffing platform — gap feature additions
**Researched:** 2026-03-20
**Confidence:** HIGH (core libs), MEDIUM (version compat details)

---

## Context

The base stack is fully established (Next.js 16.1.6, React 19.2.4, Supabase, Tailwind v4, shadcn/ui, TanStack Table 8.21.3, React Hook Form 7.71.2, Zod 4.3.6). This document covers **only additive libraries** needed for the gap features identified in PROJECT.md. Nothing below touches the existing stack — these are net-new additions.

Gap features requiring new libraries:
- Revenue analytics: bar/line charts (monthly totals, year-over-year, per-client)
- Prognose editing: editable revenue grid with inline cell editing (12 months x N clients)
- Pipeline monthly spread: grid with numeric input cells
- Consultant contract attribution: nested CRUD forms within modals
- Account detail / contract tabs: multi-tab views (already handled by shadcn Tabs, no new lib)
- Indexation wizard: already implemented with local state, no new lib needed
- URL-synced filters on list pages: shareable filter state

---

## Recommended Stack (Additions Only)

### Charting

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| recharts | ^2.x (see compat note) | Bar, line, area charts for revenue analytics, pipeline, prognose summaries | The official shadcn/ui chart component is built on recharts. Using it directly keeps styling consistent with the existing shadcn design system — no separate theme wiring. 3,800+ projects on npm, the de-facto standard for React admin dashboards in 2025/2026. |
| shadcn/ui chart (local component) | via `npx shadcn@latest add chart` | ChartContainer, ChartTooltip, ChartLegend wrappers | Shadcn copies the chart component into the codebase as owned TypeScript. Provides automatic dark/light mode and brand-color support via CSS variables — matches the existing `next-themes` setup with zero extra config. |

**Important version note (MEDIUM confidence):** recharts 3.x (latest: 3.8.0) is the newest release but shadcn/ui still ships against recharts 2.x. The shadcn docs state "We're working on upgrading to Recharts v3" as of early 2026. Install recharts 2.x until shadcn officially ships v3 support. React 19 peer dependency conflict exists for recharts 2.x — requires the `react-is` override (see Version Compatibility section).

### Numeric Input Formatting

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| react-number-format | ^5.4.4 | Currency inputs in prognose editing grid, tariff editing, contract attribution % fields | Handles the `nl-BE` locale currency display (`€ 1.234,56`) while allowing raw numeric entry, mask-based input, and controlled/uncontrolled modes. Integrates with React Hook Form via `getInputProps`. Peer-tested against React 19 (package.json declares `react: ">=19.0.0"` support). Native `Intl.NumberFormat` alone is sufficient for display-only formatting (already done in the codebase), but falls short for editable inputs that need to keep cursor position stable during typing. |

### URL-Synced Filter State

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| nuqs | ^2.8.6 | Type-safe URL search params for list page filters (revenue year, prognose year, pipeline year, account type filters) | Used in production by Supabase, Vercel, Sentry, and Clerk. Presented at Next.js Conf 2025. Provides `useQueryState` / `useQueryStates` with a `useState`-like API that serializes to the URL automatically. Shallow updates by default (no server re-render), opt-in RSC re-render when needed. 6 kB gzipped. Without this, users lose filter state on navigation — a common complaint for analytics pages. Alternative is manually encoding filters into `router.push` — fragile and verbose. |

---

## Supporting Libraries (Already in Project — Confirm Adequate)

| Library | Current Version | Gap Feature Usage | Adequate? |
|---------|----------------|-------------------|-----------|
| @tanstack/react-table | 8.21.3 | Editable prognose grid, pipeline spread grid | YES — TanStack Table supports inline editable cells via `meta.updateData` callback pattern. No additional lib needed. |
| react-hook-form | 7.71.2 | Consultant contract attribution form (nested), multi-section contract forms | YES — RHF handles nested field arrays via `useFieldArray`. Already used extensively. |
| zod | 4.3.6 | Validation for all new forms | YES |
| framer-motion | 12.36.0 | Wizard step transitions | YES — already installed, use for step animations in wizard |
| date-fns | 4.1.0 | Date formatting in contract/tariff grids | YES |
| react-day-picker | 9.14.0 | Date pickers in new forms | YES |
| sonner | 2.0.7 | Toast feedback on mutations | YES |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| ag-grid / handsontable | Overkill for the revenue/prognose grids — both are 300KB+ bundles targeting Excel-like spreadsheet UX. The prognose grid is N clients x 12 months of currency inputs, which TanStack Table + react-number-format handles with zero extra bundle cost. | TanStack Table with editable cell meta pattern + react-number-format inputs |
| recharts v3 (right now) | shadcn/ui chart is not yet officially ported to recharts v3 as of 2026-03-20. Using v3 directly would bypass the shadcn ChartContainer/theming system and create a maintenance split. | recharts 2.x with the react-is override until shadcn releases official v3 |
| tremor | A dashboard component library built on Recharts — adds another abstraction layer on top of what shadcn/ui already provides. Not needed when shadcn/ui has its own chart primitive. | shadcn chart component directly |
| zustand for wizard state | The existing indexation wizard uses local `useState` and already works. Adding Zustand for step persistence is speculative complexity not requested. | local `useState` in wizard components |
| next-query-params / use-query-params | Older alternatives to nuqs with less type safety and no native Next.js App Router support. | nuqs |
| react-currency-format | Abandoned (last update 2019). | react-number-format |

---

## Stack Patterns by Variant

**For display-only currency cells in revenue grids:**
- Use `Intl.NumberFormat('nl-BE', { style: 'currency', currency: 'EUR' })` directly — already the pattern in the codebase. No library needed.

**For editable currency/numeric cells in prognose and pipeline grids:**
- Use react-number-format's `NumericFormat` component with `thousandSeparator="."` `decimalSeparator=","` `prefix="€ "` to match `nl-BE` locale.
- Integrate with TanStack Table via the `meta.updateData` callback in the column def.

**For multi-step forms (indexation wizard, rate-change wizard):**
- Use local `useState` for step index, separate `useForm` instance per step, or one shared form with conditional field rendering. No wizard library needed — the pattern is already implemented in `indexation-wizard.tsx`.

**For chart colors matching brand themes:**
- Use CSS custom properties already defined in the shadcn/ui theme. Pass `var(--color-chart-1)` etc. via `ChartConfig` from the shadcn chart component.

---

## Installation

```bash
# Charting (recharts 2.x — see version compat note)
npm install recharts@^2.15.0 --legacy-peer-deps

# Add shadcn chart component (copies component into src/components/ui/chart.tsx)
npx shadcn@latest add chart

# Numeric inputs
npm install react-number-format@^5.4.4

# URL filter state
npm install nuqs@^2.8.6
```

After installing recharts, add the react-is override to `package.json`:

```json
"overrides": {
  "react-is": "^19.0.0"
}
```

Then run `npm install` to resolve the peer dependency.

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| recharts@^2.15.0 | React 19.2.4 | Requires `"overrides": { "react-is": "^19.0.0" }` in package.json. shadcn/ui documents this workaround. MEDIUM confidence — worked at time of research. |
| react-number-format@^5.4.4 | React 19 | Package.json declares React 19 in peerDependencies. HIGH confidence. |
| nuqs@^2.8.6 | Next.js >=14.2.0 | Explicitly supports App Router. Requires `NuqsAdapter` in root layout. HIGH confidence. |
| recharts@^3.x | React 19 | Likely compatible but shadcn chart not yet ported. Avoid until shadcn releases official v3 support. |

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| recharts + shadcn chart | Chart.js via react-chartjs-2 | If you need canvas-based rendering (better performance at 10K+ data points). Revenue/prognose grids have at most ~50 data points per chart — recharts SVG is fine. |
| TanStack Table editable cells | react-data-grid | If requirements grow to true spreadsheet behavior (copy/paste across cells, Excel import/export). Current prognose grid is a CRM editing UI, not a spreadsheet. |
| nuqs | Manual URLSearchParams in useEffect | If you have exactly one filter per page and don't care about type safety. nuqs is worth the 6 kB for any page with multiple filters. |
| react-number-format | Controlled `<input type="number">` | If inputs only need whole-number euro amounts (no decimals). Hourly rates in this app have decimals, so full formatting library is justified. |

---

## Sources

- [shadcn/ui Chart docs](https://ui.shadcn.com/docs/components/radix/chart) — recharts v2 dependency, `npx shadcn@latest add chart` command (HIGH confidence)
- [shadcn/ui React 19 guide](https://ui.shadcn.com/docs/react-19) — `react-is` override pattern for recharts + React 19 (HIGH confidence)
- [recharts releases](https://github.com/recharts/recharts/releases) — v3.8.0 is latest stable as of 2026-03-06 (HIGH confidence)
- [nuqs Next.js Conf 2025](https://nextjs.org/conf/session/type-safe-url-state-in-nextjs-with-nuqs) — official Next.js conference session confirming App Router support (HIGH confidence)
- [nuqs npm](https://www.npmjs.com/package/nuqs) — v2.8.6 current, used by Sentry/Vercel/Clerk (HIGH confidence)
- [react-number-format npm](https://www.npmjs.com/package/react-number-format) — v5.4.4, React 19 peer dep declared (HIGH confidence)
- [TanStack Table editable cells docs](https://tanstack.com/table/v8/docs/framework/react/examples/editable-data) — `meta.updateData` pattern (HIGH confidence)
- WebSearch: multi-step form patterns with shadcn/ui — no dedicated library needed, local state is the established pattern (MEDIUM confidence)

---

*Stack research for: PHPro CRM gap feature additions*
*Researched: 2026-03-20*
