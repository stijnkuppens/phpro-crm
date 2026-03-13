'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Action</label>
        <Select
          value={filters.action ?? ''}
          onValueChange={(val) =>
            onFilterChange({ ...filters, action: val || undefined })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="All actions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All actions</SelectItem>
            {ACTION_OPTIONS.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Entity Type</label>
        <Select
          value={filters.entityType ?? ''}
          onValueChange={(val) =>
            onFilterChange({ ...filters, entityType: val || undefined })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All types</SelectItem>
            {ENTITY_TYPE_OPTIONS.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <label className="block text-xs font-medium text-muted-foreground">Period</label>
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
