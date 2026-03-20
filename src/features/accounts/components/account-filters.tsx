'use client';

import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
      <Select
        value={filters.type ?? 'all'}
        onValueChange={(v) => onFilterChange({ ...filters, type: !v || v === 'all' ? undefined : v })}
      >
        <SelectTrigger className="w-36">
          <SelectValue placeholder="Alle types" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Alle types</SelectItem>
          <SelectItem value="Klant">Klant</SelectItem>
          <SelectItem value="Prospect">Prospect</SelectItem>
          <SelectItem value="Partner">Partner</SelectItem>
        </SelectContent>
      </Select>
      <Select
        value={filters.status ?? 'all'}
        onValueChange={(v) => onFilterChange({ ...filters, status: !v || v === 'all' ? undefined : v })}
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Alle statussen" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Alle statussen</SelectItem>
          <SelectItem value="Actief">Actief</SelectItem>
          <SelectItem value="Inactief">Inactief</SelectItem>
        </SelectContent>
      </Select>
      {owners.length > 0 && (
        <Select
          value={filters.owner_id ?? 'all'}
          onValueChange={(v) => onFilterChange({ ...filters, owner_id: !v || v === 'all' ? undefined : v })}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Alle owners" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle owners</SelectItem>
            {owners.map((o) => (
              <SelectItem key={o.id} value={o.id}>{o.full_name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      {countries.length > 0 && (
        <Select
          value={filters.country ?? 'all'}
          onValueChange={(v) => onFilterChange({ ...filters, country: !v || v === 'all' ? undefined : v })}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Alle landen" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle landen</SelectItem>
            {countries.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
