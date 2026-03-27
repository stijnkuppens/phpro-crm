'use client';

import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ComboboxFilter } from '@/components/admin/combobox-filter';
import type { AccountFilters } from '../types';

export type OwnerOption = { id: string; full_name: string };

type Props = {
  filters: AccountFilters;
  onFilterChange: (filters: AccountFilters) => void;
  owners?: OwnerOption[];
  countries?: string[];
};

export function AccountFiltersBar({ filters, onFilterChange, owners = [], countries = [] }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Zoek accounts..."
          value={filters.search ?? ''}
          onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
          className="w-48 pl-9"
        />
      </div>
      <ComboboxFilter
        options={[
          { value: 'Klant', label: 'Klant' },
          { value: 'Prospect', label: 'Prospect' },
          { value: 'Partner', label: 'Partner' },
        ]}
        value={filters.type ?? 'all'}
        onValueChange={(v) => onFilterChange({ ...filters, type: v === 'all' ? undefined : v })}
        placeholder="Alle types"
        searchPlaceholder="Zoek type..."
        className="w-40"
      />
      <ComboboxFilter
        options={[
          { value: 'Actief', label: 'Actief' },
          { value: 'Inactief', label: 'Inactief' },
        ]}
        value={filters.status ?? 'all'}
        onValueChange={(v) => onFilterChange({ ...filters, status: v === 'all' ? undefined : v })}
        placeholder="Alle statussen"
        searchPlaceholder="Zoek status..."
        className="w-44"
      />
      {owners.length > 0 && (
        <ComboboxFilter
          options={owners.map((o) => ({ value: o.id, label: o.full_name }))}
          value={filters.owner_id ?? 'all'}
          onValueChange={(v) => onFilterChange({ ...filters, owner_id: v === 'all' ? undefined : v })}
          placeholder="Alle owners"
          searchPlaceholder="Zoek owner..."
          className="w-48"
        />
      )}
      {countries.length > 0 && (
        <ComboboxFilter
          options={countries.map((c) => ({ value: c, label: c }))}
          value={filters.country ?? 'all'}
          onValueChange={(v) => onFilterChange({ ...filters, country: v === 'all' ? undefined : v })}
          placeholder="Alle landen"
          searchPlaceholder="Zoek land..."
          className="w-40"
        />
      )}
    </div>
  );
}
