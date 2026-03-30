'use client';

import { RotateCcw, Trash2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import DataTable from '@/components/admin/data-table';
import { buildFilterQuery } from '@/components/admin/data-table-filters';
import { useEntity } from '@/lib/hooks/use-entity';
import { useRealtime } from '@/lib/hooks/use-realtime';
import { deleteJob } from '../actions/delete-job';
import { retryJob } from '../actions/retry-job';
import { jobColumns } from '../columns';
import type { Job } from '../types';

const JobDetailModal = dynamic(() => import('./job-detail-modal').then((m) => ({ default: m.JobDetailModal })));

const PAGE_SIZE = 25;

type JobListProps = {
  initialData: Job[];
  initialCount: number;
  userId: string;
};

export function JobList({ initialData, initialCount, userId }: JobListProps) {
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Record<string, string | undefined>>({});

  const {
    data: fetchedData,
    total,
    fetchList,
    refreshing,
  } = useEntity<Job>({
    table: 'jobs',
    pageSize: PAGE_SIZE,
    initialData,
    initialCount,
  });

  const { data: realtimeData } = useRealtime<Job>('jobs', fetchedData, {
    filter: `requested_by=eq.${userId}`,
  });

  const load = useCallback(() => {
    const { orFilter, eqFilters } = buildFilterQuery(jobColumns, filters);
    fetchList({
      page,
      sort: { column: 'created_at', direction: 'desc' },
      orFilter,
      eqFilters,
    });
  }, [fetchList, page, filters]);

  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    load();
  }, [load]);

  const handleFilterChange = useCallback((newFilters: Record<string, string | undefined>) => {
    setFilters(newFilters);
    setPage(1);
  }, []);

  const handleDelete = async (id: string) => {
    const result = await deleteJob(id);
    if (result.success) {
      toast.success('Job verwijderd');
      load();
    } else {
      toast.error(typeof result.error === 'string' ? result.error : 'Verwijderen mislukt');
    }
  };

  const selectedJob = realtimeData.find((j) => j.id === selectedJobId) ?? null;

  return (
    <>
      <DataTable
        tableId="jobs"
        columns={jobColumns}
        data={realtimeData}
        filters={filters}
        onFilterChange={handleFilterChange}
        pagination={{ page, pageSize: PAGE_SIZE, total }}
        onPageChange={setPage}
        refreshing={refreshing}
        onRowClick={(row) => setSelectedJobId(row.id)}
        rowActions={(row) => [
          ...(row.status === 'failed'
            ? [
                {
                  icon: RotateCcw,
                  label: 'Opnieuw proberen',
                  onClick: async () => {
                    const result = await retryJob(row.id);
                    if (result.error) {
                      toast.error(typeof result.error === 'string' ? result.error : 'Opnieuw proberen mislukt');
                    } else {
                      toast.success('Job opnieuw gestart');
                      load();
                    }
                  },
                },
              ]
            : []),
          {
            icon: Trash2,
            label: 'Verwijderen',
            variant: 'destructive' as const,
            confirm: {
              title: 'Job verwijderen?',
              description: 'Het exportbestand wordt ook verwijderd.',
            },
            onClick: () => handleDelete(row.id),
          },
        ]}
      />

      {selectedJobId && selectedJob && (
        <JobDetailModal key={selectedJobId} job={selectedJob} open onClose={() => setSelectedJobId(null)} />
      )}
    </>
  );
}
