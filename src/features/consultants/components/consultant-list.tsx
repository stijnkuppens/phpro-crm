'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  SquarePen,
  Link2,
  Archive,
  ArchiveRestore,
  CalendarPlus,
  DollarSign,
  Square,
  RotateCcw,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import DataTable from '@/components/admin/data-table';
import { useEntity } from '@/lib/hooks/use-entity';
import { consultantColumns } from '../columns';
import {
  type ConsultantWithDetails,
  type ConsultantStatus,
  CONSULTANT_SELECT,
} from '../types';
import dynamic from 'next/dynamic';
import { archiveConsultant } from '../actions/archive-consultant';

const ConsultantDetailModal = dynamic(() => import('./consultant-detail-modal').then(m => ({ default: m.ConsultantDetailModal })), { ssr: false });
const BenchFormModal = dynamic(() => import('./bench-form-modal').then(m => ({ default: m.BenchFormModal })), { ssr: false });
const LinkConsultantWizard = dynamic(() => import('./link-consultant-wizard').then(m => ({ default: m.LinkConsultantWizard })), { ssr: false });
const StopConsultantModal = dynamic(() => import('./stop-consultant-modal').then(m => ({ default: m.StopConsultantModal })), { ssr: false });
const ExtendConsultantModal = dynamic(() => import('./extend-consultant-modal').then(m => ({ default: m.ExtendConsultantModal })), { ssr: false });
const RateChangeModal = dynamic(() => import('./rate-change-modal').then(m => ({ default: m.RateChangeModal })), { ssr: false });
import { moveToBench } from '../actions/move-to-bench';
import { formatEUR } from '@/lib/format';
import { escapeSearch } from '@/lib/utils/escape-search';

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


const statusPills: { value: ConsultantStatus | 'archived'; label: string }[] = [
  { value: 'bench', label: 'Bench' },
  { value: 'actief', label: 'Actief' },
  { value: 'stopgezet', label: 'Stopgezet' },
  { value: 'archived', label: 'Gearchiveerd' },
];

export function ConsultantListView({ initialData, initialCount, stats, accounts, roles }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState<(ConsultantStatus | 'archived')[]>(['bench', 'actief']);
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
      ? `first_name.ilike.%${escapeSearch(search)}%,last_name.ilike.%${escapeSearch(search)}%,role.ilike.%${escapeSearch(search)}%,client_name.ilike.%${escapeSearch(search)}%`
      : undefined;

    const showArchived = selectedStatuses.includes('archived');
    const realStatuses = selectedStatuses.filter((s) => s !== 'archived') as ConsultantStatus[];

    fetchList({
      page,
      sort: { column: 'last_name', direction: 'asc' },
      orFilter,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      applyFilters: (q: any) => {
        if (showArchived && realStatuses.length === 0) {
          return q.eq('is_archived', true);
        }
        if (showArchived) {
          // Show archived + selected statuses (non-archived)
          const statusConditions = realStatuses.map((s) => `and(is_archived.eq.false,status.eq.${s})`).join(',');
          return q.or(`is_archived.eq.true,${statusConditions}`);
        }
        if (realStatuses.length > 0) {
          return q.eq('is_archived', false).in('status', realStatuses);
        }
        return q.eq('is_archived', false);
      },
    });
  }, [fetchList, page, search, selectedStatuses]);

  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    load();
  }, [load, page, search, selectedStatuses]);

  useEffect(() => {
    setPage(1);
  }, [search, selectedStatuses]);

  function toggleStatus(s: ConsultantStatus | 'archived') {
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

  async function handleUnarchive(c: ConsultantWithDetails) {
    const result = await archiveConsultant(c.id, false);
    if ('error' in result && result.error) {
      toast.error(typeof result.error === 'string' ? result.error : 'Er ging iets mis');
    } else {
      toast.success('Consultant hersteld uit archief');
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
    if (row.is_archived) {
      return [
        { icon: ArchiveRestore, label: 'Herstellen', onClick: () => handleUnarchive(row) },
      ];
    }
    switch (row.status) {
      case 'bench':
        return [
          { icon: Link2, label: 'Koppel', onClick: () => setWizardTarget(row) },
          { icon: SquarePen, label: 'Bewerk', onClick: () => setEditTarget(row) },
          { icon: Archive, label: 'Archiveer', onClick: () => handleArchive(row), variant: 'destructive' as const, confirm: { title: 'Consultant archiveren?', description: 'Deze consultant wordt gearchiveerd en is niet meer zichtbaar in de lijst.' } },
        ];
      case 'actief':
        return [
          { icon: CalendarPlus, label: 'Verlengen', onClick: () => setExtendTarget(row) },
          { icon: DollarSign, label: 'Tariefwijziging', onClick: () => setRateTarget(row) },
          { icon: Square, label: 'Stopzetten', onClick: () => setStopTarget(row), variant: 'destructive' as const },
        ];
      case 'stopgezet':
        return [
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

        {/* Data table */}
        <DataTable
          tableId="consultants"
          filterBar={
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
          }
          columns={consultantColumns}
          data={data}
          onRowClick={(row) => setSelected(row)}
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
