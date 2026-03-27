'use client';

import { ComboboxFilter } from '@/components/admin/combobox-filter';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { format } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import type { AuditLogFilters } from '../types';

const ACTION_OPTIONS = [
  'create',
  'update',
  'delete',
  'login',
  'logout',
  'export',
];

const ENTITY_TYPE_OPTIONS = [
  'contact',
  'user',
  'file',
  'setting',
];

type AuditFiltersProps = {
  filters: AuditLogFilters;
  onFilterChange: (filters: AuditLogFilters) => void;
};

export function AuditFilters({ filters, onFilterChange }: AuditFiltersProps) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <ComboboxFilter
        options={ACTION_OPTIONS.map((opt) => ({ value: opt, label: opt }))}
        value={filters.action ?? 'all'}
        onValueChange={(v) => onFilterChange({ ...filters, action: v === 'all' ? undefined : v })}
        placeholder="Alle acties"
        searchPlaceholder="Zoek actie..."
        className="w-40"
      />
      <ComboboxFilter
        options={ENTITY_TYPE_OPTIONS.map((opt) => ({ value: opt, label: opt }))}
        value={filters.entityType ?? 'all'}
        onValueChange={(v) => onFilterChange({ ...filters, entityType: v === 'all' ? undefined : v })}
        placeholder="Alle entiteiten"
        searchPlaceholder="Zoek entiteit..."
        className="w-44"
      />
      <div className="space-y-1">
        <label className="block text-xs font-medium text-muted-foreground">Periode</label>
        <DateRangePicker
          value={
            filters.dateFrom
              ? { from: new Date(filters.dateFrom), to: filters.dateTo ? new Date(filters.dateTo) : undefined }
              : undefined
          }
          onChange={(range: DateRange | undefined) =>
            onFilterChange({
              ...filters,
              dateFrom: range?.from ? format(range.from, 'yyyy-MM-dd') : undefined,
              dateTo: range?.to ? format(range.to, 'yyyy-MM-dd') : undefined,
            })
          }
        />
      </div>
    </div>
  );
}
