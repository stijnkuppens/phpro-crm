'use client';

import { CheckCircle2, SquarePen, Trash2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import DataTable from '@/components/admin/data-table';
import type { FilterOption } from '@/components/admin/data-table-filters';
import { StatusBadge } from '@/components/admin/status-badge';
import { formatEUR } from '@/lib/format';
import { deleteDeal } from '../actions/delete-deal';
import { dealColumns } from '../columns';
import type { DealWithRelations, Pipeline } from '../types';

const DealEditModal = dynamic(
  () => import('./deal-edit-modal').then((m) => ({ default: m.DealEditModal })),
  {
    ssr: false,
  },
);
const CloseDealModal = dynamic(
  () => import('./close-deal-modal').then((m) => ({ default: m.CloseDealModal })),
  {
    ssr: false,
  },
);

type Props = {
  deals: DealWithRelations[];
  page: number;
  total: number;
  onPageChange: (page: number) => void;
  onRefresh?: () => void;
  loading: boolean;
  refreshing?: boolean;
  filters: Record<string, string | undefined>;
  onFilterChange: (filters: Record<string, string | undefined>) => void;
  filterOptions?: Record<string, FilterOption[]>;
  pipelines: Pipeline[];
  owners: { id: string; name: string }[];
};

export function DealList({
  deals,
  page,
  total,
  onPageChange,
  onRefresh,
  loading,
  refreshing,
  filters,
  onFilterChange,
  filterOptions,
  pipelines,
  owners,
}: Props) {
  const router = useRouter();
  const [editDeal, setEditDeal] = useState<DealWithRelations | null>(null);
  const [closeDealId, setCloseDealId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    const result = await deleteDeal(id);
    if (result.success) {
      toast.success('Deal verwijderd');
      onRefresh?.();
    } else {
      toast.error(typeof result.error === 'string' ? result.error : 'Er ging iets mis');
    }
  };

  return (
    <>
      <DataTable
        tableId="deals"
        columns={dealColumns}
        data={deals}
        filters={filters}
        onFilterChange={onFilterChange}
        filterOptions={filterOptions}
        onRowClick={(row) => router.push(`/admin/deals/${row.id}`)}
        pagination={{ page, pageSize: 50, total }}
        onPageChange={onPageChange}
        rowActions={(row) => [
          {
            icon: SquarePen,
            label: 'Bewerken',
            onClick: () => setEditDeal(row),
          },
          ...(!row.stage?.is_closed
            ? [
                {
                  icon: CheckCircle2 as typeof SquarePen,
                  label: 'Afsluiten',
                  onClick: () => setCloseDealId(row.id),
                },
              ]
            : []),
          {
            icon: Trash2,
            label: 'Verwijderen',
            variant: 'destructive' as const,
            confirm: {
              title: 'Deal verwijderen?',
              description: 'Dit verwijdert de deal permanent.',
            },
            onClick: () => handleDelete(row.id),
          },
        ]}
        bulkActions={[
          {
            label: 'Verwijderen',
            variant: 'destructive' as const,
            confirm: {
              title: 'Deals verwijderen?',
              description: 'Dit verwijdert de geselecteerde deals permanent.',
            },
            // biome-ignore lint/suspicious/useIterableCallbackReturn: forEach callback does not need a return value
            action: (ids) => ids.forEach((id) => handleDelete(id)),
          },
        ]}
        loading={loading}
        refreshing={refreshing}
        renderMobileCard={(row) => (
          <div className="flex flex-col gap-1.5 py-1">
            <span className="font-medium text-sm">{row.title}</span>
            {row.account?.name && (
              <span className="text-xs text-muted-foreground">{row.account.name}</span>
            )}
            <div className="flex flex-wrap items-center gap-1.5">
              {row.pipeline?.name && <StatusBadge positive>{row.pipeline.name}</StatusBadge>}
              {row.stage && (
                <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-muted text-foreground">
                  <span
                    className="inline-block h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: row.stage.color || '#9ca3af' }}
                  />
                  {row.stage.name}
                </span>
              )}
              {Number(row.amount) > 0 && (
                <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-muted text-foreground">
                  {formatEUR(Number(row.amount))}
                </span>
              )}
            </div>
            {row.close_date && (
              <span className="text-xs text-muted-foreground">
                {new Date(row.close_date).toLocaleDateString('nl-BE', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            )}
          </div>
        )}
      />

      {editDeal && (
        <DealEditModal
          key={editDeal.id}
          open
          onClose={() => {
            setEditDeal(null);
            onRefresh?.();
          }}
          accountId={editDeal.account_id}
          pipelines={pipelines}
          owners={owners}
          deal={editDeal}
        />
      )}

      {closeDealId && (
        <CloseDealModal
          dealId={closeDealId}
          open
          onOpenChange={(v) => {
            if (!v) setCloseDealId(null);
          }}
          onSuccess={onRefresh}
        />
      )}
    </>
  );
}
