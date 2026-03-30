'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ListPageToolbar } from '@/components/admin/list-page-toolbar';
import DataTable from '@/components/admin/data-table';
import { buildFilterQuery } from '@/components/admin/data-table-filters';
import { useEntity } from '@/lib/hooks/use-entity';
import { notificationColumns } from '../columns';
import { markAllAsRead, markAsRead } from '../actions/mark-as-read';
import type { NotificationListItem } from '../types';

type Props = {
  initialData: NotificationListItem[];
  initialCount: number;
};

const PAGE_SIZE = 25;

export function NotificationList({ initialData, initialCount }: Props) {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Record<string, string | undefined>>({});

  const { data, total, fetchList, refreshing } = useEntity<NotificationListItem>({
    table: 'notifications',
    pageSize: PAGE_SIZE,
    initialData,
    initialCount,
  });

  const load = useCallback(() => {
    const { orFilter, eqFilters } = buildFilterQuery(notificationColumns, filters);

    // Translate virtual read_status filter to actual `read` column eq filter
    const resolvedEqFilters = { ...eqFilters };
    if (resolvedEqFilters?.read_status) {
      resolvedEqFilters.read = resolvedEqFilters.read_status === 'gelezen' ? 'true' : 'false';
      delete resolvedEqFilters.read_status;
    }

    fetchList({
      page,
      sort: { column: 'created_at', direction: 'desc' },
      orFilter: orFilter || undefined,
      eqFilters: Object.keys(resolvedEqFilters ?? {}).length > 0 ? resolvedEqFilters : undefined,
    });
  }, [fetchList, page, filters]);

  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) { isInitialMount.current = false; return; }
    load();
  }, [load]);

  useEffect(() => { setPage(1); }, [filters]);

  const handleMarkAllRead = useCallback(async () => {
    const result = await markAllAsRead();
    if (result.success) {
      toast.success('Alle meldingen als gelezen gemarkeerd');
      load();
      router.refresh();
    } else {
      toast.error(typeof result.error === 'string' ? result.error : 'Er is een fout opgetreden');
    }
  }, [load, router]);

  const handleRowClick = useCallback(async (row: NotificationListItem) => {
    if (!row.read) {
      await markAsRead(row.id);
    }
    const link = (row.metadata as Record<string, unknown> | null)?.link as string | undefined;
    if (link) {
      router.push(link);
    }
  }, [router]);

  const hasUnread = data.some((n) => !n.read);

  return (
    <div className="space-y-6">
      <ListPageToolbar
        actions={
          hasUnread ? (
            <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
              <CheckCheck /> Alles gelezen
            </Button>
          ) : undefined
        }
      />

      <DataTable
        tableId="notifications"
        columns={notificationColumns}
        data={data}
        filters={filters}
        onFilterChange={setFilters}
        refreshing={refreshing}
        pagination={{ page, pageSize: PAGE_SIZE, total }}
        onPageChange={setPage}
        onRowClick={handleRowClick}
      />
    </div>
  );
}
