'use client';

import { useState, useCallback, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { LayoutGrid, List } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase/client';
import { DealKanban } from './deal-kanban';
import { DealList } from './deal-list';
import type { DealCard, DealWithRelations } from '../types';

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
  initialPipelineId: string;
};

export function DealsPageClient({ pipelines, initialDeals, initialCount, initialPipelineId }: Props) {
  const [activePipeline, setActivePipeline] = useState(initialPipelineId);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [deals, setDeals] = useState(initialDeals);
  const [total, setTotal] = useState(initialCount);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const fetchDeals = useCallback(async (signal?: { cancelled: boolean }) => {
    setLoading(true);
    const supabase = createBrowserClient();
    const from = (page - 1) * 50;
    const to = from + 49;

    const { data, count } = await supabase
      .from('deals')
      .select(`
        *,
        account:accounts!account_id(id, name),
        contact:contacts!contact_id(id, first_name, last_name),
        owner:user_profiles!owner_id(id, full_name),
        stage:pipeline_stages!stage_id(id, name, color, probability, is_closed, is_won, is_longterm),
        pipeline:pipelines!pipeline_id(id, name, type)
      `, { count: 'exact' })
      .eq('pipeline_id', activePipeline)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (signal?.cancelled) return;
    setDeals((data as unknown as DealWithRelations[]) ?? []);
    setTotal(count ?? 0);
    setLoading(false);
  }, [page, activePipeline]);

  useEffect(() => {
    // Skip initial fetch — server provided data for the first pipeline + page 1
    if (page === 1 && activePipeline === initialPipelineId) return;
    const signal = { cancelled: false };
    fetchDeals(signal);
    return () => { signal.cancelled = true; };
  }, [fetchDeals, page, activePipeline, initialPipelineId]);

  // Reset to page 1 when switching pipelines
  useEffect(() => {
    setPage(1);
  }, [activePipeline]);

  const pipeline = pipelines.find((p) => p.id === activePipeline);

  const dealCards: DealCard[] = deals
    .filter((d) => !d.closed_at)
    .map((d) => ({
      id: d.id,
      title: d.title,
      amount: Number(d.amount ?? 0),
      probability: d.probability ?? 0,
      close_date: d.close_date,
      account_name: d.account?.name ?? '',
      owner_name: d.owner?.full_name ?? null,
      stage_id: d.stage_id,
      forecast_category: d.forecast_category,
    }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Tabs value={activePipeline} onValueChange={setActivePipeline}>
          <TabsList>
            {pipelines.map((p) => (
              <TabsTrigger key={p.id} value={p.id}>{p.name}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="flex gap-1">
          <Button
            variant={viewMode === 'kanban' ? 'default' : 'ghost'}
            size="icon"
            onClick={() => setViewMode('kanban')}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="icon"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {viewMode === 'kanban' && pipeline ? (
        <DealKanban
          stages={pipeline.stages}
          deals={dealCards}
          onRefresh={() => fetchDeals()}
        />
      ) : (
        <DealList
          deals={deals}
          page={page}
          total={total}
          onPageChange={setPage}
          loading={loading}
        />
      )}
    </div>
  );
}
