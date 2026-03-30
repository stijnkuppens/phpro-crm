'use client';

import {
  Archive,
  ArchiveRestore,
  CalendarPlus,
  DollarSign,
  Link2,
  Plus,
  RotateCcw,
  Square,
  SquarePen,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Avatar } from '@/components/admin/avatar';
import DataTable from '@/components/admin/data-table';
import { FilterPill } from '@/components/admin/filter-pill';
import { ListPageToolbar } from '@/components/admin/list-page-toolbar';
import { StatusBadge } from '@/components/admin/status-badge';
import { Button } from '@/components/ui/button';
import { archiveConsultant } from '../actions/archive-consultant';
import { moveToBench } from '../actions/move-to-bench';
import { consultantColumns } from '../columns';
import {
  CONSULTANT_STATUS_STYLES,
  type ConsultantStatus,
  type ConsultantWithDetails,
} from '../types';

const ConsultantDetailModal = dynamic(
  () =>
    import('./consultant-detail-modal').then((m) => ({
      default: m.ConsultantDetailModal,
    })),
  { ssr: false },
);
const BenchFormModal = dynamic(
  () => import('./bench-form-modal').then((m) => ({ default: m.BenchFormModal })),
  {
    ssr: false,
  },
);
const LinkConsultantWizard = dynamic(
  () =>
    import('./link-consultant-wizard').then((m) => ({
      default: m.LinkConsultantWizard,
    })),
  { ssr: false },
);
const StopConsultantModal = dynamic(
  () =>
    import('./stop-consultant-modal').then((m) => ({
      default: m.StopConsultantModal,
    })),
  { ssr: false },
);
const ExtendConsultantModal = dynamic(
  () =>
    import('./extend-consultant-modal').then((m) => ({
      default: m.ExtendConsultantModal,
    })),
  { ssr: false },
);
const RateChangeModal = dynamic(
  () => import('./rate-change-modal').then((m) => ({ default: m.RateChangeModal })),
  {
    ssr: false,
  },
);

type Props = {
  accountId: string;
  accountName: string;
  consultants: ConsultantWithDetails[];
  roles: { value: string; label: string }[];
};

const STATUS_PILLS: { value: ConsultantStatus | 'archived'; label: string }[] = [
  { value: 'actief', label: 'Actief' },
  { value: 'bench', label: 'Bench' },
  { value: 'stopgezet', label: 'Stopgezet' },
  { value: 'archived', label: 'Gearchiveerd' },
];

export function AccountConsultantsTab({ accountId, accountName, consultants, roles }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<ConsultantWithDetails | null>(null);
  const [editTarget, setEditTarget] = useState<ConsultantWithDetails | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardTarget, setWizardTarget] = useState<ConsultantWithDetails | null>(null);
  const [stopTarget, setStopTarget] = useState<ConsultantWithDetails | null>(null);
  const [extendTarget, setExtendTarget] = useState<ConsultantWithDetails | null>(null);
  const [rateTarget, setRateTarget] = useState<ConsultantWithDetails | null>(null);
  const [selectedStatuses, setSelectedStatuses] = useState<Set<string>>(
    new Set(['actief', 'bench', 'stopgezet']),
  );

  function toggleStatus(s: string) {
    setSelectedStatuses((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });
  }

  const filteredData = useMemo(() => {
    return consultants.filter((c) => {
      if (c.is_archived) return selectedStatuses.has('archived');
      return selectedStatuses.has(c.status);
    });
  }, [consultants, selectedStatuses]);

  function handleRefresh() {
    router.refresh();
  }

  async function handleArchive(c: ConsultantWithDetails) {
    const result = await archiveConsultant(c.id, true);
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
        {
          icon: ArchiveRestore,
          label: 'Herstellen',
          onClick: () => handleUnarchive(row),
        },
      ];
    }
    switch (row.status) {
      case 'bench':
        return [
          { icon: Link2, label: 'Koppel', onClick: () => setWizardTarget(row) },
          {
            icon: SquarePen,
            label: 'Bewerk',
            onClick: () => setEditTarget(row),
          },
          {
            icon: Archive,
            label: 'Archiveer',
            onClick: () => handleArchive(row),
            variant: 'destructive' as const,
            confirm: {
              title: 'Consultant archiveren?',
              description:
                'Deze consultant wordt gearchiveerd en is niet meer zichtbaar in de lijst.',
            },
          },
        ];
      case 'actief':
        return [
          {
            icon: CalendarPlus,
            label: 'Verlengen',
            onClick: () => setExtendTarget(row),
          },
          {
            icon: DollarSign,
            label: 'Tariefwijziging',
            onClick: () => setRateTarget(row),
          },
          {
            icon: Square,
            label: 'Stopzetten',
            onClick: () => setStopTarget(row),
            variant: 'destructive' as const,
          },
        ];
      case 'stopgezet':
        return [
          {
            icon: RotateCcw,
            label: 'Naar bench',
            onClick: () => handleMoveToBench(row),
          },
        ];
      default:
        return [];
    }
  }

  return (
    <>
      <div className="space-y-4 mt-4">
        <ListPageToolbar
          actions={
            <Button size="sm" onClick={() => setWizardOpen(true)}>
              <Plus /> Consultant koppelen
            </Button>
          }
        />
        <DataTable
          tableId="account-consultants"
          columns={consultantColumns}
          data={filteredData}
          onRowClick={(row) => setSelected(row)}
          rowActions={(row) => getRowActions(row)}
          filterBar={
            <div className="flex gap-1.5 overflow-x-auto">
              {STATUS_PILLS.map((pill) => {
                const active = selectedStatuses.has(pill.value);
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
          }
          renderMobileCard={(row) => {
            const name = `${row.first_name} ${row.last_name}`;
            const initials =
              `${row.first_name?.[0] ?? ''}${row.last_name?.[0] ?? ''}`.toUpperCase();
            return (
              <div className="flex items-center gap-3">
                <Avatar path={null} fallback={initials} size="sm" round />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-medium text-sm">{name}</span>
                    <StatusBadge colorMap={CONSULTANT_STATUS_STYLES} value={row.status}>
                      {row.status}
                    </StatusBadge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {row.role}
                    {row.client_name ? ` · ${row.client_name}` : ''}
                  </div>
                  {row.city && <div className="text-[11px] text-muted-foreground">{row.city}</div>}
                </div>
              </div>
            );
          }}
        />
      </div>

      {selected && (
        <ConsultantDetailModal
          consultant={selected}
          open={!!selected}
          onClose={() => {
            setSelected(null);
            handleRefresh();
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

      {(wizardOpen || wizardTarget) && (
        <LinkConsultantWizard
          open
          onClose={() => {
            setWizardOpen(false);
            setWizardTarget(null);
            handleRefresh();
          }}
          accounts={[
            {
              id: accountId,
              name: accountName,
              domain: null,
              type: null,
              city: null,
            },
          ]}
          roles={roles}
          preselectedAccountId={accountId}
          preselectedBenchConsultantId={wizardTarget?.id}
        />
      )}
    </>
  );
}
