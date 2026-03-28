'use client';

import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ComboboxFilter } from '@/components/admin/combobox-filter';
import type { ColumnDef, RowData } from '@tanstack/react-table';
import { escapeSearch } from '@/lib/utils/escape-search';

// ── Filter meta types ──────────────────────────────────────────────────────

export type FilterOption = { value: string; label: string };

export type SearchFilterMeta = {
  type: 'search';
  placeholder?: string;
  /** DB columns for orFilter (defaults to [accessorKey]) */
  searchColumns?: string[];
};

export type SelectFilterMeta = {
  type: 'select';
  /** Static options — overridden by filterOptions prop when same key exists */
  options?: FilterOption[];
  placeholder?: string;
  /** Key in eqFilters (defaults to accessorKey) */
  filterKey?: string;
};

export type PillsFilterMeta = {
  type: 'pills';
  /** Static options — overridden by filterOptions prop when same key exists */
  options?: FilterOption[];
  /** Label for the "all" pill (defaults to "Alles") */
  allLabel?: string;
  /** Key in eqFilters (defaults to accessorKey) */
  filterKey?: string;
};

export type ColumnFilterMeta = SearchFilterMeta | SelectFilterMeta | PillsFilterMeta;

// ── TanStack Table meta augmentation ───────────────────────────────────────

declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    /** Human-readable column label (used by column settings) */
    label?: string;
    /** Filter configuration for auto-generated filter bar */
    filter?: ColumnFilterMeta;
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────

function getAccessorKey<T>(col: ColumnDef<T>): string {
  return ('accessorKey' in col ? (col.accessorKey as string) : col.id) ?? '';
}

function getFilterKey<T>(col: ColumnDef<T>): string {
  const meta = col.meta?.filter;
  if ((meta?.type === 'select' || meta?.type === 'pills') && meta.filterKey) return meta.filterKey;
  return getAccessorKey(col);
}

// ── DataTableFilters component ─────────────────────────────────────────────

type DataTableFiltersProps<T> = {
  columns: ColumnDef<T>[];
  filters: Record<string, string | undefined>;
  onFilterChange: (filters: Record<string, string | undefined>) => void;
  /** Dynamic options keyed by column accessorKey or filterKey */
  filterOptions?: Record<string, FilterOption[]>;
};

export function DataTableFilters<T>({
  columns,
  filters,
  onFilterChange,
  filterOptions,
}: DataTableFiltersProps<T>) {
  const filterColumns = columns.filter((col) => col.meta?.filter);
  const inlineColumns = filterColumns.filter((col) => col.meta!.filter!.type !== 'pills');
  const pillsColumns = filterColumns.filter((col) => col.meta!.filter!.type === 'pills');

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        {inlineColumns.map((col) => {
          const meta = col.meta!.filter!;
          const key = getFilterKey(col);

          if (meta.type === 'search') {
            return (
              <div key={key} className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={meta.placeholder ?? 'Zoeken...'}
                  value={filters[key] ?? ''}
                  onChange={(e) =>
                    onFilterChange({ ...filters, [key]: e.target.value || undefined })
                  }
                  className="w-48 pl-9"
                />
              </div>
            );
          }

          if (meta.type === 'select') {
            const options = filterOptions?.[key] ?? meta.options ?? [];
            if (options.length === 0) return null;

            return (
              <ComboboxFilter
                key={key}
                options={options}
                value={filters[key] ?? 'all'}
                onValueChange={(v) =>
                  onFilterChange({ ...filters, [key]: v === 'all' ? undefined : v })
                }
                placeholder={meta.placeholder ?? 'Alles'}
                searchPlaceholder="Zoek..."
              />
            );
          }

          return null;
        })}
      </div>
      {pillsColumns.map((col) => {
        const meta = col.meta!.filter! as PillsFilterMeta;
        const key = getFilterKey(col);
        const options = filterOptions?.[key] ?? meta.options ?? [];
        if (options.length === 0) return null;
        const active = filters[key];

        return (
          <div key={key} className="flex gap-1.5">
            <button
              type="button"
              onClick={() => onFilterChange({ ...filters, [key]: undefined })}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                !active
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted'
              }`}
            >
              {meta.allLabel ?? 'Alle'}
            </button>
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() =>
                  onFilterChange({ ...filters, [key]: active === opt.value ? undefined : opt.value })
                }
                className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                  active === opt.value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        );
      })}
    </div>
  );
}

// ── Query builder helper ───────────────────────────────────────────────────

/**
 * Converts filter state + column meta into Supabase-compatible query params.
 * Use in list components to build orFilter/eqFilters for fetchList().
 */
export function buildFilterQuery<T>(
  columns: ColumnDef<T>[],
  filters: Record<string, string | undefined>,
) {
  let orFilter: string | undefined;
  const eqFilters: Record<string, string> = {};

  for (const col of columns) {
    const meta = col.meta?.filter;
    if (!meta) continue;

    const accessorKey = getAccessorKey(col);

    if (meta.type === 'search') {
      const value = filters[accessorKey];
      if (value) {
        const fields = meta.searchColumns ?? [accessorKey];
        orFilter = fields.map((f) => `${f}.ilike.%${escapeSearch(value)}%`).join(',');
      }
    } else if (meta.type === 'select' || meta.type === 'pills') {
      const key = meta.filterKey ?? accessorKey;
      const value = filters[key];
      if (value) eqFilters[key] = value;
    }
  }

  return {
    orFilter,
    eqFilters: Object.keys(eqFilters).length > 0 ? eqFilters : undefined,
  };
}
