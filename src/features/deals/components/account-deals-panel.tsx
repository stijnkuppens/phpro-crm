'use client';

import { Plus } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { buildFilterQuery, type FilterOption } from '@/components/admin/data-table-filters';
import { ListPageToolbar } from '@/components/admin/list-page-toolbar';
import { Button } from '@/components/ui/button';
import { useEntity } from '@/lib/hooks/use-entity';
import { dealColumns } from '../columns';
import { DEAL_SELECT, FORECAST_CATEGORY_OPTIONS, ORIGIN_OPTIONS, PAGE_SIZE } from '../constants';
import type { DealWithRelations, Pipeline } from '../types';
import { DealList } from './deal-list';

const DealEditModal = dynamic(
  () => import('./deal-edit-modal').then((m) => ({ default: m.DealEditModal })),
  {
    ssr: false,
  },
);

type Props = {
  pipelines: Pipeline[];
  initialDeals: DealWithRelations[];
  initialCount: number;
  owners: { id: string; name: string }[];
  accountId: string;
};

export function AccountDealsPanel({
  pipelines,
  initialDeals,
  initialCount,
  owners,
  accountId,
}: Props) {
  const [filters, setFilters] = useState<Record<string, string | undefined>>({});
  const [page, setPage] = useState(1);
  const [showNewDeal, setShowNewDeal] = useState(false);
  const isInitialMount = useRef(true);

  const { data, total, loading, refreshing, fetchList } = useEntity<DealWithRelations>({
    table: 'deals',
    select: DEAL_SELECT,
    pageSize: PAGE_SIZE,
    initialData: initialDeals,
    initialCount,
  });

  const filterOptions = useMemo<Record<string, FilterOption[]>>(() => {
    const pipelineOpts: FilterOption[] = pipelines.map((p) => ({
      value: p.id,
      label: p.name,
    }));

    const activePipelineId = filters.pipeline_id;
    const relevantPipelines = activePipelineId
      ? pipelines.filter((p) => p.id === activePipelineId)
      : pipelines;
    const stageOpts: FilterOption[] = relevantPipelines
      .flatMap((p) => p.stages)
      .filter((s) => !s.is_closed)
      .map((s) => ({ value: s.id, label: s.name }));

    const ownerMap = new Map<string, string>();
    for (const d of data) {
      if (d.owner?.id && d.owner.full_name) ownerMap.set(d.owner.id, d.owner.full_name);
    }
    const ownerOpts: FilterOption[] = [...ownerMap.entries()].map(([id, name]) => ({
      value: id,
      label: name,
    }));

    const leadSources = new Set<string>();
    for (const d of data) {
      if (d.lead_source) leadSources.add(d.lead_source);
    }
    const leadSourceOpts: FilterOption[] = [...leadSources]
      .sort()
      .map((s) => ({ value: s, label: s }));

    return {
      pipeline_id: pipelineOpts,
      stage_id: stageOpts,
      owner_id: ownerOpts,
      lead_source: leadSourceOpts,
      origin: ORIGIN_OPTIONS,
      forecast_category: FORECAST_CATEGORY_OPTIONS,
    };
  }, [pipelines, data, filters.pipeline_id]);

  const load = useCallback(() => {
    const { orFilter, eqFilters: autoFilters } = buildFilterQuery(dealColumns, filters);
    const eqFilters: Record<string, string> = {
      ...autoFilters,
      account_id: accountId,
    };

    fetchList({ page, orFilter, eqFilters });
  }, [fetchList, page, filters, accountId]);

  const handleFilterChange = useCallback((newFilters: Record<string, string | undefined>) => {
    setFilters(newFilters);
    setPage(1);
  }, []);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    load();
  }, [load]);

  return (
    <>
      <div className="space-y-4 mt-4">
        <ListPageToolbar
          actions={
            <Button size="sm" onClick={() => setShowNewDeal(true)}>
              <Plus /> Nieuwe deal
            </Button>
          }
        />
        <DealList
          deals={data}
          page={page}
          total={total}
          onPageChange={setPage}
          onRefresh={() => load()}
          loading={loading}
          refreshing={refreshing}
          filters={filters}
          onFilterChange={handleFilterChange}
          filterOptions={filterOptions}
          pipelines={pipelines}
          owners={owners}
        />
      </div>

      {showNewDeal && (
        <DealEditModal
          open
          onClose={() => {
            setShowNewDeal(false);
            load();
          }}
          pipelines={pipelines}
          owners={owners}
          accountId={accountId}
        />
      )}
    </>
  );
}
