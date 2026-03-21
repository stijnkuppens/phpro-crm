'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';
import { FilterBar } from '@/components/admin/filter-bar';
import DataTable from '@/components/admin/data-table';
import { consultantColumns } from '../columns';
import {
  getContractStatus,
  getCurrentRate,
  type ActiveConsultantWithDetails,
  type ContractStatus,
} from '../types';
import { ConsultantDetailModal } from './consultant-detail-modal';

type Props = {
  initialData: ActiveConsultantWithDetails[];
};

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

export function ConsultantListView({ initialData }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState<ActiveConsultantWithDetails | null>(null);

  // Compute statuses once
  const withStatus = useMemo(
    () =>
      initialData.map((c) => ({
        consultant: c,
        status: getContractStatus(c),
        rate: getCurrentRate(c),
      })),
    [initialData],
  );

  // Filter
  const filtered = useMemo(() => {
    let items = withStatus;

    if (statusFilter) {
      items = items.filter((i) => i.status === statusFilter);
    }

    if (search) {
      const q = search.toLowerCase();
      items = items.filter((i) => {
        const c = i.consultant;
        return (
          `${c.first_name} ${c.last_name}`.toLowerCase().includes(q) ||
          (c.role?.toLowerCase().includes(q) ?? false) ||
          (c.account?.name?.toLowerCase().includes(q) ?? false)
        );
      });
    }

    return items;
  }, [withStatus, search, statusFilter]);

  const filteredData = useMemo(
    () => filtered.map((i) => i.consultant),
    [filtered],
  );

  // Stats
  const stats = useMemo(() => {
    const active = withStatus.filter((i) => !i.consultant.is_stopped);
    const maxRevenue = active.reduce((sum, i) => sum + i.rate * 8 * 21, 0);
    const critical = withStatus.filter((i) => i.status === 'kritiek').length;
    const stopped = withStatus.filter((i) => i.consultant.is_stopped).length;

    return {
      activeCount: active.length,
      maxRevenue,
      critical,
      stopped,
    };
  }, [withStatus]);

  return (
    <>
      <div className="space-y-4">
        {/* Stat cards */}
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
            <Select value={statusFilter} onValueChange={setStatusFilter}>
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
          </div>
        </FilterBar>

        {/* Data table */}
        <DataTable
          columns={consultantColumns}
          data={filteredData}
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
    </>
  );
}
