'use client';

import DataTable from '@/components/admin/data-table';
import { dealColumns } from '../columns';
import type { DealWithRelations } from '../types';

type Props = {
  deals: DealWithRelations[];
  page: number;
  total: number;
  onPageChange: (page: number) => void;
  loading: boolean;
};

export function DealList({ deals, page, total, onPageChange, loading }: Props) {
  return (
    <DataTable
      columns={dealColumns}
      data={deals}
      pagination={{ page, pageSize: 50, total }}
      onPageChange={onPageChange}
      loading={loading}
    />
  );
}
