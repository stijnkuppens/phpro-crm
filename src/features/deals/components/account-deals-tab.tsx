'use client';

import DataTable from '@/components/admin/data-table';
import type { DealWithRelations } from '../types';
import { dealColumns } from '../columns';

type Props = {
  deals: DealWithRelations[];
};

export function AccountDealsTab({ deals }: Props) {
  if (deals.length === 0) {
    return <div className="py-8 text-center text-muted-foreground">Geen deals voor dit account.</div>;
  }

  return <DataTable columns={dealColumns} data={deals} />;
}
