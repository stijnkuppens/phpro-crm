'use client';

import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { AccountFilters } from '../types';

type Props = {
  filters: AccountFilters;
  onFilterChange: (filters: AccountFilters) => void;
};

export function AccountFiltersBar({ filters, onFilterChange }: Props) {
  return (
    <div className="flex flex-wrap gap-4">
      <Input
        placeholder="Zoeken op naam of domein..."
        value={filters.search ?? ''}
        onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
        className="w-64"
      />
      <Select
        value={filters.type ?? 'all'}
        onValueChange={(v) => onFilterChange({ ...filters, type: !v || v === 'all' ? undefined : v })}
      >
        <SelectTrigger className="w-32">
          <SelectValue placeholder="Type" />
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
        <SelectTrigger className="w-32">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Alle</SelectItem>
          <SelectItem value="Actief">Actief</SelectItem>
          <SelectItem value="Inactief">Inactief</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
