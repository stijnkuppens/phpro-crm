'use client';

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { LayoutGrid, List, Archive, Plus } from 'lucide-react';
import { useEntity } from '@/lib/hooks/use-entity';
import { buildFilterQuery, type FilterOption } from '@/components/admin/data-table-filters';
import { PageHeader } from '@/components/admin/page-header';
import { SubNav, type SubNavItem } from '@/components/admin/sub-nav';
import { dealColumns } from '../columns';
import { DealKanban } from './deal-kanban';
import { DealList } from './deal-list';
import dynamic from 'next/dynamic';

const DealEditModal = dynamic(() => import('./deal-edit-modal').then(m => ({ default: m.DealEditModal })), { ssr: false });
import type { DealCard, DealWithRelations } from '../types';

const DEAL_SELECT = `
  *,
  account:accounts!account_id(id, name),
  contact:contacts!contact_id(id, first_name, last_name, title),
  owner:user_profiles!owner_id(id, full_name),
  stage:pipeline_stages!stage_id(id, name, color, probability, is_closed, is_won, is_longterm),
  pipeline:pipelines!pipeline_id(id, name, type)
`;

const PAGE_SIZE = 50;

const VIEW_MODES: SubNavItem[] = [
  { key: 'list', label: 'Deals', icon: List },
  { key: 'kanban', label: 'Pipeline', icon: LayoutGrid },
  { key: 'archief', label: 'Archief', icon: Archive },
];

const ORIGIN_OPTIONS: FilterOption[] = [
  { value: 'rechtstreeks', label: 'Direct' },
  { value: 'cronos', label: 'Cronos' },
];

type Pipeline = {
  id: string;
  name: string;
  type: string;
  stages: {
    id: string;
    name: string;
    color: string;
    sort_order: number;
    is_closed: boolean;
    is_won: boolean;
    is_longterm: boolean;
    probability: number;
  }[];
};

type Props = {
  pipelines: Pipeline[];
  initialDeals: DealWithRelations[];
  initialCount: number;
  owners: { id: string; name: string }[];
  accountId?: string;
};

export function DealsPageClient({ pipelines, initialDeals, initialCount, owners, accountId }: Props) {
  const [viewMode, setViewMode] = useState<'list' | 'kanban' | 'archief'>('list');
  const [filters, setFilters] = useState<Record<string, string | undefined>>({});
  const [page, setPage] = useState(1);
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
    const pipelineOpts: FilterOption[] = pipelines.map((p) => ({ value: p.id, label: p.name }));

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
    const ownerOpts: FilterOption[] = [...ownerMap.entries()].map(([id, name]) => ({ value: id, label: name }));

    const leadSources = new Set<string>();
    for (const d of data) {
      if (d.lead_source) leadSources.add(d.lead_source);
    }
    const leadSourceOpts: FilterOption[] = [...leadSources].sort().map((s) => ({ value: s, label: s }));

    return {
      pipeline_id: pipelineOpts,
      stage_id: stageOpts,
      owner_id: ownerOpts,
      lead_source: leadSourceOpts,
      origin: ORIGIN_OPTIONS,
    };
  }, [pipelines, data, filters.pipeline_id]);

  const load = useCallback(() => {
    const { orFilter, eqFilters: autoFilters } = buildFilterQuery(dealColumns, filters);
    const eqFilters: Record<string, string> = { ...autoFilters };

    // Hard-filter by account when embedded in account page
    if (accountId) {
      eqFilters.account_id = accountId;
    }

    // View mode filter: kanban = active only, archief = closed only
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let applyFilters: ((query: any) => any) | undefined;
    if (viewMode === 'kanban') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      applyFilters = (q: any) => q.is('closed_at', null);
    } else if (viewMode === 'archief') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      applyFilters = (q: any) => q.not('closed_at', 'is', null);
    }

    fetchList({ page, orFilter, eqFilters, applyFilters });
  }, [fetchList, page, filters, viewMode, accountId]);

  const handleFilterChange = useCallback(
    (newFilters: Record<string, string | undefined>) => {
      setFilters(newFilters);
      setPage(1);
    },
    [],
  );

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      if (initialDeals && page === 1) return;
    }
    load();
  }, [load, initialDeals, page, filters, viewMode]);

  // For kanban: use first pipeline or the filtered one
  const kanbanPipelineId = filters.pipeline_id || pipelines[0]?.id;
  const kanbanPipeline = pipelines.find((p) => p.id === kanbanPipelineId);

  const dealCards: DealCard[] = useMemo(() => data.map((d) => ({
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
  })), [data]);

  return (
    <div>
      {!accountId && (
        <div className="space-y-3">
          <PageHeader
            title="Deals"
            breadcrumbs={[
              { label: 'Admin', href: '/admin' },
              { label: 'Deals' },
            ]}
          />

          <div className="flex items-center justify-between">
            <SubNav
              items={VIEW_MODES}
              activeKey={viewMode}
              onSelect={(key) => setViewMode(key as 'list' | 'kanban' | 'archief')}
            />
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowQuickDeal(true)}>
                RFP / Profiel
              </Button>
              <Button size="sm" onClick={() => setShowQuickDeal(true)}>
                <Plus /> Nieuwe deal
              </Button>
            </div>
          </div>
        </div>
      )}

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

      {!accountId && showQuickDeal && (
        <DealEditModal
          open
          onClose={() => { setShowQuickDeal(false); load(); }}
          pipelines={pipelines}
          owners={owners}
        />
      )}

      {kanbanCreateStageId && (
        <DealEditModal
          key={kanbanCreateStageId}
          open
          onClose={() => { setKanbanCreateStageId(null); load(); }}
          pipelines={pipelines}
          owners={owners}
          initialStageId={kanbanCreateStageId}
        />
      )}
    </div>
  );
}
