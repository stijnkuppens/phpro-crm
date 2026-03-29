import { cache } from 'react';
import { createServerClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import type { DealCard } from '../types';

export const getDealsByPipeline = cache(
  async (pipelineId: string): Promise<DealCard[]> => {
    const supabase = await createServerClient();

    const { data, error } = await supabase
      .from('deals')
      .select(`
        id, title, amount, probability, close_date, stage_id, forecast_category, origin, lead_source,
        account:accounts!account_id(name),
        owner:user_profiles!owner_id(full_name)
      `)
      .eq('pipeline_id', pipelineId)
      .is('closed_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error({ err: error, entity: 'deals' }, 'Failed to fetch deals by pipeline');
      return [];
    }

    return (data ?? []).map((d) => ({
      id: d.id,
      title: d.title,
      amount: Number(d.amount ?? 0),
      probability: d.probability ?? 0,
      close_date: d.close_date,
      account_name: d.account?.name ?? '',
      owner_name: d.owner?.full_name ?? null,
      stage_id: d.stage_id,
      forecast_category: d.forecast_category,
      origin: d.origin ?? null,
      lead_source: d.lead_source ?? null,
    }));
  },
);
