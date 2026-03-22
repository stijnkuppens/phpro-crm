'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Eye,
  Plus,
  Pencil,
  Link2,
  Archive,
  CalendarPlus,
  DollarSign,
  Square,
  RotateCcw,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FilterBar } from '@/components/admin/filter-bar';
import DataTable from '@/components/admin/data-table';
import { useEntity } from '@/lib/hooks/use-entity';
import { consultantColumns } from '../columns';
import {
  type ConsultantWithDetails,
  type ConsultantStatus,
  CONSULTANT_SELECT,
} from '../types';
import { ConsultantDetailModal } from './consultant-detail-modal';
import { BenchFormModal } from './bench-form-modal';
import { LinkConsultantWizard } from './link-consultant-wizard';
import { StopConsultantModal } from './stop-consultant-modal';
import { ExtendConsultantModal } from './extend-consultant-modal';
import { RateChangeModal } from './rate-change-modal';
import { archiveConsultant } from '../actions/archive-consultant';
import { moveToBench } from '../actions/move-to-bench';
import { formatEUR } from '@/lib/format';

type Stats = {
  benchCount: number;
  activeCount: number;
  maxRevenue: number;
  stoppedCount: number;
};

type Account = { id: string; name: string; domain: string | null; type: string | null; city: string | null };

type Props = {
  initialData: ConsultantWithDetails[];
  initialCount: number;
  stats: Stats;
  accounts: Account[];
  roles: { value: string; label: string }[];
};

const PAGE_SIZE = 25;


const statusPills: { value: ConsultantStatus; label: string }[] = [
  { value: 'bench', label: 'Bench' },
  { value: 'actief', label: 'Actief' },
  { value: 'stopgezet', label: 'Stopgezet' },
];

export function ConsultantListView({ initialData, initialCount, stats, accounts, roles }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState<ConsultantStatus[]>(['bench', 'actief']);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<ConsultantWithDetails | null>(null);
  const [editTarget, setEditTarget] = useState<ConsultantWithDetails | null>(null);
  const [wizardTarget, setWizardTarget] = useState<ConsultantWithDetails | null>(null);
  const [stopTarget, setStopTarget] = useState<ConsultantWithDetails | null>(null);
  const [extendTarget, setExtendTarget] = useState<ConsultantWithDetails | null>(null);
  const [rateTarget, setRateTarget] = useState<ConsultantWithDetails | null>(null);
  const [showNewBench, setShowNewBench] = useState(false);

  const { data, total, fetchList } = useEntity<ConsultantWithDetails>({
    table: 'consultants',
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
      sort: { column: 'last_name', direction: 'asc' },
      orFilter,
      applyFilters: selectedStatuses.length > 0
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ? (q: any) => q.in('status', selectedStatuses).eq('is_archived', false)
        : // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (q: any) => q.eq('is_archived', false),
    });
  }, [fetchList, page, search, selectedStatuses]);

  useEffect(() => {
    if (page === 1 && !search && selectedStatuses.length === 2 && selectedStatuses.includes('bench') && selectedStatuses.includes('actief')) return;
    load();
  }, [load, page, search, selectedStatuses]);

  useEffect(() => {
    setPage(1);
  }, [search, selectedStatuses]);

  function toggleStatus(s: ConsultantStatus) {
    setSelectedStatuses((prev) =>
      prev.includes(s) ? prev.filter((v) => v !== s) : [...prev, s],
    );
  }

  function handleRefresh() {
    load();
    router.refresh();
  }

  async function handleArchive(c: ConsultantWithDetails) {
    const result = await archiveConsultant(c.id);
    if ('error' in result && result.error) {
      toast.error(typeof result.error === 'string' ? result.error : 'Er ging iets mis');
    } else {
      toast.success('Consultant gearchiveerd');
      handleRefresh();
    }
  }

  async function handleMoveToBench(c: ConsultantWithDetails) {
    const result = await moveToBench(c.id);
    if ('error' in result && result.error) {
      toast.error(typeof result.error === 'string' ? result.error : 'Er ging iets mis');
    } else {
      toast.success('Consultant naar bench verplaatst');
      handleRefresh();
    }
  }

  function getRowActions(row: ConsultantWithDetails) {
    switch (row.status) {
      case 'bench':
        return [
          { icon: Link2, label: 'Koppel', onClick: () => setWizardTarget(row) },
          { icon: Pencil, label: 'Bewerk', onClick: () => setEditTarget(row) },
          { icon: Archive, label: 'Archiveer', onClick: () => handleArchive(row), variant: 'destructive' as const, confirm: { title: 'Consultant archiveren?', description: 'Deze consultant wordt gearchiveerd en is niet meer zichtbaar in de lijst.' } },
        ];
      case 'actief':
        return [
          { icon: Eye, label: 'Bekijken', onClick: () => setSelected(row) },
          { icon: CalendarPlus, label: 'Verlengen', onClick: () => setExtendTarget(row) },
          { icon: DollarSign, label: 'Tariefwijziging', onClick: () => setRateTarget(row) },
          { icon: Square, label: 'Stopzetten', onClick: () => setStopTarget(row), variant: 'destructive' as const },
        ];
      case 'stopgezet':
        return [
          { icon: Eye, label: 'Bekijken', onClick: () => setSelected(row) },
          { icon: RotateCcw, label: 'Naar bench', onClick: () => handleMoveToBench(row) },
        ];
      default:
        return [];
    }
  }

  return (
    <>
      <div className="space-y-4">
        {/* Stat cards */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Bench
              </div>
              <div className="text-2xl font-bold mt-1">{stats.benchCount}</div>
              <div className="text-xs text-muted-foreground">consultants</div>
            </CardContent>
          </Card>
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
              <div className="text-2xl font-bold mt-1">{formatEUR(stats.maxRevenue)}</div>
              <div className="text-xs text-muted-foreground">op basis van uurtarieven</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Stopgezet
              </div>
              <div className="text-2xl font-bold mt-1">{stats.stoppedCount}</div>
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
            <div className="flex gap-1.5">
              {statusPills.map((pill) => {
                const active = selectedStatuses.includes(pill.value);
                return (
                  <button
                    key={pill.value}
                    type="button"
                    onClick={() => toggleStatus(pill.value)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      active
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {pill.label}
                  </button>
                );
              })}
            </div>
            <div className="flex-1" />
            <Button size="sm" onClick={() => setShowNewBench(true)}>
              <Plus />
              Nieuwe consultant
            </Button>
          </div>
        </FilterBar>

        {/* Data table */}
        <DataTable
          columns={consultantColumns}
          data={data}
          pagination={{ page, pageSize: PAGE_SIZE, total }}
          onPageChange={setPage}
          rowActions={(row) => getRowActions(row)}
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

      {stopTarget && (
        <StopConsultantModal
          consultantId={stopTarget.id}
          open={!!stopTarget}
          onClose={() => setStopTarget(null)}
          onSuccess={handleRefresh}
        />
      )}

      {extendTarget && (
        <ExtendConsultantModal
          consultantId={extendTarget.id}
          open={!!extendTarget}
          onClose={() => setExtendTarget(null)}
          onSuccess={handleRefresh}
        />
      )}

      {rateTarget && (
        <RateChangeModal
          consultantId={rateTarget.id}
          open={!!rateTarget}
          onClose={() => setRateTarget(null)}
          onSuccess={handleRefresh}
        />
      )}

      <BenchFormModal
        open={showNewBench}
        onClose={() => {
          setShowNewBench(false);
          handleRefresh();
        }}
      />

      {editTarget && (
        <BenchFormModal
          open={!!editTarget}
          onClose={() => {
            setEditTarget(null);
            handleRefresh();
          }}
          consultant={editTarget}
        />
      )}

      {wizardTarget && (
        <LinkConsultantWizard
          open={!!wizardTarget}
          onClose={() => {
            setWizardTarget(null);
            handleRefresh();
          }}
          accounts={accounts}
          roles={roles}
          preselectedBenchConsultantId={wizardTarget.id}
        />
      )}
    </>
  );
}
