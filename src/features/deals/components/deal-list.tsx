'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { SquarePen, Trash2, CheckCircle2 } from 'lucide-react';
import DataTable from '@/components/admin/data-table';
import type { FilterOption } from '@/components/admin/data-table-filters';
import { dealColumns } from '../columns';
import { deleteDeal } from '../actions/delete-deal';
import type { DealWithRelations, Pipeline } from '../types';
import dynamic from 'next/dynamic';

const DealEditModal = dynamic(() => import('./deal-edit-modal').then(m => ({ default: m.DealEditModal })), { ssr: false });
const CloseDealModal = dynamic(() => import('./close-deal-modal').then(m => ({ default: m.CloseDealModal })), { ssr: false });

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

export function DealList({ deals, page, total, onPageChange, onRefresh, loading, refreshing, filters, onFilterChange, filterOptions, pipelines, owners }: Props) {
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
          { icon: SquarePen, label: 'Bewerken', onClick: () => setEditDeal(row) },
          ...(!row.stage?.is_closed ? [{ icon: CheckCircle2 as typeof SquarePen, label: 'Afsluiten', onClick: () => setCloseDealId(row.id) }] : []),
          { icon: Trash2, label: 'Verwijderen', variant: 'destructive' as const, confirm: { title: 'Deal verwijderen?', description: 'Dit verwijdert de deal permanent.' }, onClick: () => handleDelete(row.id) },
        ]}
        bulkActions={[
          { label: 'Verwijderen', variant: 'destructive' as const, confirm: { title: 'Deals verwijderen?', description: 'Dit verwijdert de geselecteerde deals permanent.' }, action: (ids) => ids.forEach((id) => handleDelete(id)) },
        ]}
        loading={loading}
        refreshing={refreshing}
      />

      {editDeal && (
        <DealEditModal
          key={editDeal.id}
          open
          onClose={() => { setEditDeal(null); onRefresh?.(); }}
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
          onOpenChange={(v) => { if (!v) setCloseDealId(null); }}
          onSuccess={onRefresh}
        />
      )}
    </>
  );
}
