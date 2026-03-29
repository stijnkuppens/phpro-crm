'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryState, parseAsInteger, parseAsArrayOf, parseAsString } from 'nuqs';
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
import { Input } from '@/components/ui/input';
import { StatCard } from '@/components/admin/stat-card';
import { FilterPill } from '@/components/admin/filter-pill';
import { PageHeader } from '@/components/admin/page-header';
import { ExportDropdown } from '@/components/admin/export-dropdown';
import { consultantExportColumns } from '../export-columns';
import { Button } from '@/components/ui/button';
import DataTable from '@/components/admin/data-table';
import { useEntity } from '@/lib/hooks/use-entity';
import { consultantColumns } from '../columns';
import {
  type ConsultantWithDetails,
  type ConsultantStatus,
  type ConsultantAccount,
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
import { Avatar } from '@/components/admin/avatar';
import { StatusBadge } from '@/components/admin/status-badge';
import {
  CONSULTANT_STATUS_STYLES,
  CONSULTANT_STATUS_LABELS,
  contractStatusColors,
} from '../types';
import { getContractStatus, getCurrentRate } from '../utils';

type Stats = {
  benchCount: number;
  activeCount: number;
  maxRevenue: number;
  stoppedCount: number;
};

type Props = {
  initialData: ConsultantWithDetails[];
  initialCount: number;
  stats: Stats;
  accounts: ConsultantAccount[];
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
  const [search, setSearch] = useQueryState('q', { defaultValue: '' });
  const [selectedStatuses, setSelectedStatuses] = useQueryState('statuses', parseAsArrayOf(parseAsString).withDefault(['bench', 'actief']));
  const [page, setPage] = useQueryState('page', parseAsInteger.withDefault(1));
  type ActiveModal =
    | { type: 'view'; consultant: ConsultantWithDetails }
    | { type: 'edit'; consultant: ConsultantWithDetails }
    | { type: 'wizard'; consultant: ConsultantWithDetails }
    | { type: 'stop'; consultant: ConsultantWithDetails }
    | { type: 'extend'; consultant: ConsultantWithDetails }
    | { type: 'rate'; consultant: ConsultantWithDetails }
    | null;

  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
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
  }, [load]);

  function toggleStatus(s: ConsultantStatus | 'archived') {
    setSelectedStatuses((prev) =>
      prev.includes(s) ? prev.filter((v) => v !== s) : [...prev, s],
    );
    setPage(1);
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
          { icon: Link2, label: 'Koppel', onClick: () => setActiveModal({ type: 'wizard', consultant: row }) },
          { icon: SquarePen, label: 'Bewerk', onClick: () => setActiveModal({ type: 'edit', consultant: row }) },
          { icon: Archive, label: 'Archiveer', onClick: () => handleArchive(row), variant: 'destructive' as const, confirm: { title: 'Consultant archiveren?', description: 'Deze consultant wordt gearchiveerd en is niet meer zichtbaar in de lijst.' } },
        ];
      case 'actief':
        return [
          { icon: SquarePen, label: 'Bewerk', onClick: () => setActiveModal({ type: 'edit', consultant: row }) },
          { icon: CalendarPlus, label: 'Verlengen', onClick: () => setActiveModal({ type: 'extend', consultant: row }) },
          { icon: DollarSign, label: 'Tariefwijziging', onClick: () => setActiveModal({ type: 'rate', consultant: row }) },
          { icon: Square, label: 'Stopzetten', onClick: () => setActiveModal({ type: 'stop', consultant: row }), variant: 'destructive' as const },
        ];
      case 'stopgezet':
        return [
          { icon: SquarePen, label: 'Bewerk', onClick: () => setActiveModal({ type: 'edit', consultant: row }) },
          { icon: RotateCcw, label: 'Naar bench', onClick: () => handleMoveToBench(row) },
        ];
      default:
        return [];
    }
  }

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          title="Consultants"
          breadcrumbs={[
            { label: 'Admin', href: '/admin' },
            { label: 'Consultants' },
          ]}
          actions={
            <div className="flex gap-2">
              <ExportDropdown
                entity="consultants"
                columns={consultantExportColumns}
                filters={{ sort: { column: 'last_name', direction: 'asc' } }}
              />
              <Button size="sm" onClick={() => setShowNewBench(true)}>
                <Plus />
                Nieuwe consultant
              </Button>
            </div>
          }
        />

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Bench" value={stats.benchCount} subtitle="consultants" />
          <StatCard title="Actief" value={stats.activeCount} subtitle="consultants" />
          <StatCard title="Max maandomzet" value={formatEUR(stats.maxRevenue)} subtitle="op basis van uurtarieven" />
          <StatCard title="Stopgezet" value={stats.stoppedCount} subtitle="consultants" />
        </div>

        {/* Data table */}
        <DataTable
          tableId="consultants"
          filterBar={
            <div className="flex flex-wrap items-center gap-3">
              <Input
                placeholder="Zoek consultant..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full sm:w-64"
              />
              <div className="flex gap-1.5">
                {statusPills.map((pill) => {
                  const active = selectedStatuses.includes(pill.value);
                  return (
                    <FilterPill
                      key={pill.value}
                      label={pill.label}
                      active={active}
                      onClick={() => toggleStatus(pill.value)}
                    />
                  );
                })}
              </div>
            </div>
          }
          columns={consultantColumns}
          data={data}
          onRowClick={(row) => setActiveModal({ type: 'view', consultant: row })}
          pagination={{ page, pageSize: PAGE_SIZE, total }}
          onPageChange={setPage}
          rowActions={(row) => getRowActions(row)}
          renderMobileCard={(row) => {
            const name = `${row.first_name} ${row.last_name}`;
            const initials = [row.first_name, row.last_name]
              .map((w) => w?.[0]?.toUpperCase() ?? '')
              .join('');
            const rate = row.status === 'bench'
              ? (() => {
                  if (row.min_hourly_rate != null && row.max_hourly_rate != null)
                    return `${formatEUR(row.min_hourly_rate)}–${formatEUR(row.max_hourly_rate)}/u`;
                  if (row.min_hourly_rate != null) return `vanaf ${formatEUR(row.min_hourly_rate)}/u`;
                  if (row.max_hourly_rate != null) return `tot ${formatEUR(row.max_hourly_rate)}/u`;
                  return null;
                })()
              : `${formatEUR(getCurrentRate(row))}/u`;
            const contractStatus = row.status === 'actief' && !row.is_archived
              ? getContractStatus(row)
              : null;
            const roleLabel = row.status === 'bench' ? row.roles?.[0] : row.role;
            const clientName = row.account?.name ?? row.client_name;
            return (
              <div className="flex items-start gap-3">
                <Avatar fallback={initials} path={row.avatar_path} size="md" round />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-medium">{name}</span>
                    <StatusBadge colorMap={CONSULTANT_STATUS_STYLES} value={row.status}>
                      {CONSULTANT_STATUS_LABELS[row.status as keyof typeof CONSULTANT_STATUS_LABELS] ?? row.status}
                    </StatusBadge>
                    {contractStatus && (
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${contractStatusColors[contractStatus]}`}>
                        {contractStatus}
                      </span>
                    )}
                  </div>
                  {row.city && (
                    <div className="mt-0.5 text-xs text-muted-foreground">{row.city}</div>
                  )}
                  {(roleLabel || clientName) && (
                    <div className="mt-1 text-xs text-muted-foreground">
                      {[roleLabel, clientName].filter(Boolean).join(' · ')}
                    </div>
                  )}
                  {rate && (
                    <div className="mt-1 text-sm font-semibold text-primary-action">{rate}</div>
                  )}
                </div>
              </div>
            );
          }}
        />
      </div>

      {activeModal?.type === 'view' && (
        <ConsultantDetailModal
          consultant={activeModal.consultant}
          open
          onClose={() => {
            setActiveModal(null);
            router.refresh();
          }}
        />
      )}

      {activeModal?.type === 'stop' && (
        <StopConsultantModal
          consultantId={activeModal.consultant.id}
          open
          onClose={() => setActiveModal(null)}
          onSuccess={handleRefresh}
        />
      )}

      {activeModal?.type === 'extend' && (
        <ExtendConsultantModal
          consultantId={activeModal.consultant.id}
          open
          onClose={() => setActiveModal(null)}
          onSuccess={handleRefresh}
        />
      )}

      {activeModal?.type === 'rate' && (
        <RateChangeModal
          consultantId={activeModal.consultant.id}
          open
          onClose={() => setActiveModal(null)}
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

      {activeModal?.type === 'edit' && (
        <BenchFormModal
          open
          onClose={() => {
            setActiveModal(null);
            handleRefresh();
          }}
          consultant={activeModal.consultant}
        />
      )}

      {activeModal?.type === 'wizard' && (
        <LinkConsultantWizard
          open
          onClose={() => {
            setActiveModal(null);
            handleRefresh();
          }}
          accounts={accounts}
          roles={roles}
          preselectedBenchConsultantId={activeModal.consultant.id}
        />
      )}
    </>
  );
}
