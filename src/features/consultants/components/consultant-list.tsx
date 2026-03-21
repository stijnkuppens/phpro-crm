'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, Plus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';
import { FilterBar } from '@/components/admin/filter-bar';
import DataTable from '@/components/admin/data-table';
import { useEntity } from '@/lib/hooks/use-entity';
import { consultantColumns } from '../columns';
import {
  getContractStatus,
  getCurrentRate,
  type ActiveConsultantWithDetails,
  type ContractStatus,
} from '../types';
import { ConsultantDetailModal } from './consultant-detail-modal';
import { LinkConsultantWizard } from './link-consultant-wizard';
import type { BenchConsultantWithLanguages } from '@/features/bench/types';
import { CONSULTANT_SELECT } from '../types';

type Account = { id: string; name: string; domain: string | null; type: string | null; city: string | null };

type Stats = {
  activeCount: number;
  maxRevenue: number;
  critical: number;
  stopped: number;
};

type Props = {
  initialData: ActiveConsultantWithDetails[];
  initialCount: number;
  stats: Stats;
  accounts: Account[];
  benchConsultants: BenchConsultantWithLanguages[];
  roles: { value: string; label: string }[];
};

const PAGE_SIZE = 25;

const statusOptions: { value: string; label: string }[] = [
  { value: '', label: 'Alle' },
  { value: 'actief', label: 'Actief' },
  { value: 'waarschuwing', label: 'Waarschuwing' },
  { value: 'kritiek', label: 'Kritiek' },
  { value: 'verlopen', label: 'Verlopen' },
  { value: 'onbepaald', label: 'Onbepaald' },
  { value: 'stopgezet', label: 'Stopgezet' },
];

const eurFmt = new Intl.NumberFormat('nl-BE', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
});

/** Translate computed status to Supabase filter conditions */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyStatusFilter(query: any, status: string) {
  const today = new Date().toISOString().split('T')[0];
  const in60 = new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0];
  const in120 = new Date(Date.now() + 120 * 86400000).toISOString().split('T')[0];

  switch (status) {
    case 'stopgezet':
      return query.eq('is_stopped', true);
    case 'onbepaald':
      return query.eq('is_stopped', false).or('is_indefinite.eq.true,end_date.is.null');
    case 'verlopen':
      return query.eq('is_stopped', false).eq('is_indefinite', false).lt('end_date', today);
    case 'kritiek':
      return query.eq('is_stopped', false).eq('is_indefinite', false).gte('end_date', today).lte('end_date', in60);
    case 'waarschuwing':
      return query.eq('is_stopped', false).eq('is_indefinite', false).gt('end_date', in60).lte('end_date', in120);
    case 'actief':
      return query.eq('is_stopped', false).eq('is_indefinite', false).gt('end_date', in120);
    default:
      return query;
  }
}

export function ConsultantListView({ initialData, initialCount, stats, accounts, benchConsultants, roles }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<ActiveConsultantWithDetails | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);

  const { data, total, fetchList } = useEntity<ActiveConsultantWithDetails>({
    table: 'active_consultants',
    select: CONSULTANT_SELECT,
    pageSize: PAGE_SIZE,
    initialData,
    initialCount,
  });

  const load = useCallback(() => {
    const orFilter = search
      ? `first_name.ilike.%${search}%,last_name.ilike.%${search}%,role.ilike.%${search}%,client_name.ilike.%${search}%`
      : undefined;

    fetchList({
      page,
      sort: { column: 'is_stopped', direction: 'asc' },
      orFilter,
      applyFilters: statusFilter
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ? (q: any) => applyStatusFilter(q, statusFilter)
        : undefined,
    });
  }, [fetchList, page, search, statusFilter]);

  // Re-fetch when filters or page change — skip on initial render with no filters
  useEffect(() => {
    let cancelled = false;
    if (page === 1 && !search && !statusFilter) return;
    if (!cancelled) load();
    return () => { cancelled = true; };
  }, [load, page, search, statusFilter]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  return (
    <>
      <div className="space-y-4">
        {/* Stat cards — computed from full unfiltered dataset (server-side) */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Actief
              </div>
              <div className="text-2xl font-bold mt-1">{stats.activeCount}</div>
              <div className="text-xs text-muted-foreground">consultants</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Max maandomzet
              </div>
              <div className="text-2xl font-bold mt-1">{eurFmt.format(stats.maxRevenue)}</div>
              <div className="text-xs text-muted-foreground">op basis van uurtarieven</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Kritieke contracten
              </div>
              <div className="text-2xl font-bold mt-1">{stats.critical}</div>
              <div className="text-xs text-muted-foreground">binnen 60 dagen</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Stopgezet
              </div>
              <div className="text-2xl font-bold mt-1">{stats.stopped}</div>
              <div className="text-xs text-muted-foreground">consultants</div>
            </CardContent>
          </Card>
        </div>

        {/* Filter bar */}
        <FilterBar>
          <div className="flex flex-wrap items-center gap-3">
            <Input
              placeholder="Zoek consultant..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64"
            />
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? '')}>
              <SelectTrigger>
                {statusOptions.find((o) => o.value === statusFilter)?.label ?? 'Alle'}
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex-1" />
            <Button size="sm" onClick={() => setWizardOpen(true)}>
              <Plus />
              Opdracht koppelen
            </Button>
          </div>
        </FilterBar>

        {/* Data table with server-side pagination */}
        <DataTable
          columns={consultantColumns}
          data={data}
          pagination={{ page, pageSize: PAGE_SIZE, total }}
          onPageChange={setPage}
          rowActions={(row) => [
            {
              icon: Eye,
              label: 'Bekijken',
              onClick: () => setSelected(row),
            },
          ]}
        />
      </div>

      {selected && (
        <ConsultantDetailModal
          consultant={selected}
          open={!!selected}
          onClose={() => {
            setSelected(null);
            router.refresh();
          }}
        />
      )}

      <LinkConsultantWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        accounts={accounts}
        benchConsultants={benchConsultants}
        roles={roles}
      />
    </>
  );
}
