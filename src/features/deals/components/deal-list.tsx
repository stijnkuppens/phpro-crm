'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import DataTable from '@/components/admin/data-table';
import { dealColumns } from '../columns';
import { deleteDeal } from '../actions/delete-deal';
import type { DealWithRelations } from '../types';

type Props = {
  deals: DealWithRelations[];
  page: number;
  total: number;
  onPageChange: (page: number) => void;
  onRefresh?: () => void;
  loading: boolean;
};

export function DealList({ deals, page, total, onPageChange, onRefresh, loading }: Props) {
  const router = useRouter();

  const handleDelete = async (id: string) => {
    const result = await deleteDeal(id);
    if (result.success) {
      toast.success('Deal verwijderd');
      onRefresh?.();
    } else {
      toast.error(result.error as string);
    }
  };

  return (
    <DataTable
      columns={dealColumns}
      data={deals}
      pagination={{ page, pageSize: 50, total }}
      onPageChange={onPageChange}
      rowActions={(row) => [
        { icon: Eye, label: 'Bekijken', onClick: () => router.push(`/admin/accounts/${row.account_id}`) },
        { icon: Pencil, label: 'Bewerken', onClick: () => router.push(`/admin/accounts/${row.account_id}`) },
        { icon: Trash2, label: 'Verwijderen', variant: 'destructive' as const, confirm: { title: 'Deal verwijderen?', description: 'Dit verwijdert de deal permanent.' }, onClick: () => handleDelete(row.id) },
      ]}
      bulkActions={[
        { label: 'Verwijderen', variant: 'destructive' as const, confirm: { title: 'Deals verwijderen?', description: 'Dit verwijdert de geselecteerde deals permanent.' }, action: (ids) => ids.forEach((id) => handleDelete(id)) },
      ]}
      loading={loading}
    />
  );
}
