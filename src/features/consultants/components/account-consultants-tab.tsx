'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Plus,
  CalendarPlus,
  DollarSign,
  Square,
  RotateCcw,
  Link2,
  SquarePen,
  Archive,
  ArchiveRestore,
} from 'lucide-react';
import DataTable from '@/components/admin/data-table';
import { consultantColumns } from '../columns';
import { type ConsultantWithDetails, type ConsultantStatus } from '../types';
import { archiveConsultant } from '../actions/archive-consultant';
import { moveToBench } from '../actions/move-to-bench';
import dynamic from 'next/dynamic';

const ConsultantDetailModal = dynamic(() => import('./consultant-detail-modal').then(m => ({ default: m.ConsultantDetailModal })), { ssr: false });
const BenchFormModal = dynamic(() => import('./bench-form-modal').then(m => ({ default: m.BenchFormModal })), { ssr: false });
const LinkConsultantWizard = dynamic(() => import('./link-consultant-wizard').then(m => ({ default: m.LinkConsultantWizard })), { ssr: false });
const StopConsultantModal = dynamic(() => import('./stop-consultant-modal').then(m => ({ default: m.StopConsultantModal })), { ssr: false });
const ExtendConsultantModal = dynamic(() => import('./extend-consultant-modal').then(m => ({ default: m.ExtendConsultantModal })), { ssr: false });
const RateChangeModal = dynamic(() => import('./rate-change-modal').then(m => ({ default: m.RateChangeModal })), { ssr: false });

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
  const [selectedStatuses, setSelectedStatuses] = useState<Set<string>>(new Set(['actief', 'bench', 'stopgezet']));

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
      <div className="space-y-4 mt-4">
        <DataTable
          tableId="account-consultants"
          columns={consultantColumns}
          data={filteredData}
          onRowClick={(row) => setSelected(row)}
          rowActions={(row) => getRowActions(row)}
          filterBar={
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                {STATUS_PILLS.map((pill) => {
                  const active = selectedStatuses.has(pill.value);
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
              <Button size="sm" onClick={() => setWizardOpen(true)}>
                <Plus />
                Consultant koppelen
              </Button>
            </div>
          }
        />
      </div>

      {selected && (
        <ConsultantDetailModal
          consultant={selected}
          open={!!selected}
          onClose={() => { setSelected(null); handleRefresh(); }}
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
          onClose={() => { setEditTarget(null); handleRefresh(); }}
          consultant={editTarget}
        />
      )}

      {(wizardOpen || wizardTarget) && (
        <LinkConsultantWizard
          open
          onClose={() => { setWizardOpen(false); setWizardTarget(null); handleRefresh(); }}
          accounts={[{ id: accountId, name: accountName, domain: null, type: null, city: null }]}
          roles={roles}
          preselectedAccountId={accountId}
          preselectedBenchConsultantId={wizardTarget?.id}
        />
      )}
    </>
  );
}
