'use client';

import { useState, useCallback, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LayoutGrid, List, Archive } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase/client';
import { DealKanban } from './deal-kanban';
import { DealList } from './deal-list';
import { QuickDealModal } from './quick-deal-modal';
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
  const [viewMode, setViewMode] = useState<'list' | 'kanban' | 'archief'>('kanban');
  const [deals, setDeals] = useState(initialDeals);
  const [total, setTotal] = useState(initialCount);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [originFilter, setOriginFilter] = useState<string>('all');
  const [showQuickDeal, setShowQuickDeal] = useState(false);

  const fetchDeals = useCallback(async (signal?: { cancelled: boolean }) => {
    setLoading(true);
    const supabase = createBrowserClient();
    const from = (page - 1) * 50;
    const to = from + 49;

    let query = supabase
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

    // Server-side closed filter: kanban shows active only, archief shows closed only, list shows all
    if (viewMode === 'kanban') {
      query = query.is('closed_at', null);
    } else if (viewMode === 'archief') {
      query = query.not('closed_at', 'is', null);
    }

    // Origin filter
    if (originFilter !== 'all') {
      query = query.eq('origin', originFilter as 'rechtstreeks' | 'cronos');
    }

    const { data, count } = await query;

    if (signal?.cancelled) return;
    setDeals((data as unknown as DealWithRelations[]) ?? []);
    setTotal(count ?? 0);
    setLoading(false);
  }, [page, activePipeline, viewMode, originFilter]);

  useEffect(() => {
    // Skip initial fetch — server provided data for the first pipeline + page 1 + kanban + no origin filter
    if (page === 1 && activePipeline === initialPipelineId && viewMode === 'kanban' && originFilter === 'all') return;
    const signal = { cancelled: false };
    fetchDeals(signal);
    return () => { signal.cancelled = true; };
  }, [fetchDeals, page, activePipeline, initialPipelineId, viewMode, originFilter]);

  // Reset to page 1 when switching pipelines, view mode, or origin filter
  useEffect(() => {
    setPage(1);
  }, [activePipeline, viewMode, originFilter]);

  const pipeline = pipelines.find((p) => p.id === activePipeline);

  const dealCards: DealCard[] = deals.map((d) => ({
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
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Tabs value={activePipeline} onValueChange={setActivePipeline}>
            <TabsList>
              {pipelines.map((p) => (
                <TabsTrigger key={p.id} value={p.id}>{p.name}</TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <Select value={originFilter} onValueChange={(v) => { if (v) setOriginFilter(v); }}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle herkomst</SelectItem>
              <SelectItem value="rechtstreeks">Direct</SelectItem>
              <SelectItem value="cronos">Cronos</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowQuickDeal(true)}>
            RFP / Profiel
          </Button>
        </div>
        <div className="flex gap-1 rounded-lg border p-1">
          {([
            { value: 'list' as const, label: 'Deals', icon: List },
            { value: 'kanban' as const, label: 'Pipeline', icon: LayoutGrid },
            { value: 'archief' as const, label: 'Archief', icon: Archive },
          ]).map(({ value, label, icon: Icon }) => (
            <Button
              key={value}
              variant={viewMode === value ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode(value)}
            >
              <Icon className="h-4 w-4 mr-1" /> {label}
            </Button>
          ))}
        </div>
      </div>

      {viewMode === 'kanban' && pipeline ? (
        <DealKanban
          stages={pipeline.stages}
          deals={dealCards}
          onRefresh={() => fetchDeals()}
        />
      ) : viewMode === 'archief' ? (
        <DealList
          deals={deals}
          page={page}
          total={total}
          onPageChange={setPage}
          loading={loading}
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

      <QuickDealModal
        open={showQuickDeal}
        onClose={() => setShowQuickDeal(false)}
        pipelines={pipelines}
        onSuccess={() => fetchDeals()}
      />
    </div>
  );
}
