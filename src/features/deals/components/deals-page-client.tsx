'use client';

import { Archive, LayoutGrid, List, Plus } from 'lucide-react';
import dynamic from 'next/dynamic';
import { parseAsInteger, useQueryState } from 'nuqs';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { buildFilterQuery, type FilterOption } from '@/components/admin/data-table-filters';
import { ExportDropdown } from '@/components/admin/export-dropdown';
import { PageHeader } from '@/components/admin/page-header';
import { SubNav, type SubNavItem } from '@/components/admin/sub-nav';
import { Button } from '@/components/ui/button';
import { useEntity } from '@/lib/hooks/use-entity';
import { dealColumns } from '../columns';
import { DEAL_SELECT, FORECAST_CATEGORY_OPTIONS, ORIGIN_OPTIONS, PAGE_SIZE } from '../constants';
import { dealExportColumns } from '../export-columns';
import { DealKanban } from './deal-kanban';
import { DealList } from './deal-list';

const DealEditModal = dynamic(
  () => import('./deal-edit-modal').then((m) => ({ default: m.DealEditModal })),
  {
    ssr: false,
  },
);

import type { DealCard, DealWithRelations, Pipeline } from '../types';

const VIEW_MODES: SubNavItem[] = [
  { key: 'list', label: 'Deals', icon: List },
  { key: 'kanban', label: 'Pipeline', icon: LayoutGrid },
  { key: 'archief', label: 'Archief', icon: Archive },
];

type Props = {
  pipelines: Pipeline[];
  initialDeals: DealWithRelations[];
  initialCount: number;
  owners: { id: string; name: string }[];
  accounts: { id: string; name: string }[];
};

export function DealsPageClient({
  pipelines,
  initialDeals,
  initialCount,
  owners,
  accounts,
}: Props) {
  const [viewMode, setViewMode] = useQueryState('view', {
    defaultValue: 'list',
  });
  const [filters, setFilters] = useState<Record<string, string | undefined>>({});
  const [page, setPage] = useQueryState('page', parseAsInteger.withDefault(1));
  const [showQuickDeal, setShowQuickDeal] = useState(false);
  const [kanbanCreateStageId, setKanbanCreateStageId] = useState<string | null>(null);
  const isInitialMount = useRef(true);

  const { data, total, loading, refreshing, fetchList } = useEntity<DealWithRelations>({
    table: 'deals',
    select: DEAL_SELECT,
    pageSize: PAGE_SIZE,
    initialData: initialDeals,
    initialCount,
  });

  // Build filter options from pipelines + current data
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
    const eqFilters: Record<string, string> = { ...autoFilters };

    // View mode filter: kanban = active only, archief = closed only
    // biome-ignore lint/suspicious/noExplicitAny: Supabase query builder type is complex; any is intentional here
    let applyFilters: ((query: any) => any) | undefined;
    if (viewMode === 'kanban') {
      // biome-ignore lint/suspicious/noExplicitAny: Supabase query builder type is complex; any is intentional here
      applyFilters = (q: any) => q.is('closed_at', null);
    } else if (viewMode === 'archief') {
      // biome-ignore lint/suspicious/noExplicitAny: Supabase query builder type is complex; any is intentional here
      applyFilters = (q: any) => q.not('closed_at', 'is', null);
    }

    fetchList({ page, orFilter, eqFilters, applyFilters });
  }, [fetchList, page, filters, viewMode]);

  const handleFilterChange = useCallback(
    (newFilters: Record<string, string | undefined>) => {
      setFilters(newFilters);
      setPage(1);
    },
    [setPage],
  );

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    load();
  }, [load]);

  // For kanban: use first pipeline or the filtered one
  const kanbanPipelineId = filters.pipeline_id || pipelines[0]?.id;
  const kanbanPipeline = pipelines.find((p) => p.id === kanbanPipelineId);

  const dealCards: DealCard[] = useMemo(
    () =>
      data.map((d) => ({
        id: d.id,
        title: d.title,
        amount: Number(d.amount ?? 0),
        probability: d.probability ?? 0,
        close_date: d.close_date,
        account_name: d.account?.name ?? '',
        owner_name: d.owner?.full_name ?? null,
        stage_id: d.stage_id,
        forecast_category: d.forecast_category,
        origin: d.origin,
        lead_source: d.lead_source ?? null,
      })),
    [data],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Deals"
        breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Deals' }]}
        actions={
          <div className="flex gap-2">
            <ExportDropdown
              entity="deals"
              columns={dealExportColumns}
              filters={{ sort: { column: 'created_at', direction: 'desc' } }}
            />
            <Button size="sm" onClick={() => setShowQuickDeal(true)}>
              <Plus /> Nieuwe deal
            </Button>
          </div>
        }
      />

      <SubNav
        items={VIEW_MODES}
        activeKey={viewMode}
        onSelect={(key) => {
          setViewMode(key);
          setPage(1);
        }}
      />

      {viewMode === 'kanban' && kanbanPipeline ? (
        <DealKanban
          stages={kanbanPipeline.stages}
          deals={dealCards}
          onRefresh={() => load()}
          onCreateDeal={(stageId) => setKanbanCreateStageId(stageId)}
        />
      ) : (
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
      )}

      {showQuickDeal && (
        <DealEditModal
          open
          onClose={() => {
            setShowQuickDeal(false);
            load();
          }}
          pipelines={pipelines}
          owners={owners}
          accounts={accounts}
        />
      )}

      {kanbanCreateStageId && (
        <DealEditModal
          key={kanbanCreateStageId}
          open
          onClose={() => {
            setKanbanCreateStageId(null);
            load();
          }}
          pipelines={pipelines}
          owners={owners}
          accounts={accounts}
          initialStageId={kanbanCreateStageId}
        />
      )}
    </div>
  );
}
