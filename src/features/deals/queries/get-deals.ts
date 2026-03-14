import { cache } from 'react';
import { createServerClient } from '@/lib/supabase/server';
import type { DealWithRelations, DealFilters } from '../types';

type GetDealsParams = {
  filters?: DealFilters;
  page?: number;
  pageSize?: number;
};

export const getDeals = cache(
  async ({
    filters,
    page = 1,
    pageSize = 50,
  }: GetDealsParams = {}): Promise<{ data: DealWithRelations[]; count: number }> => {
    const supabase = await createServerClient();
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

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
      .order('created_at', { ascending: false })
      .range(from, to);

    if (filters?.pipeline_id) {
      query = query.eq('pipeline_id', filters.pipeline_id);
    }
    if (filters?.search) {
      query = query.ilike('title', `%${filters.search}%`);
    }
    if (filters?.owner_id) {
      query = query.eq('owner_id', filters.owner_id);
    }
    if (filters?.forecast_category) {
      query = query.eq('forecast_category', filters.forecast_category as 'Commit' | 'Best Case' | 'Pipeline' | 'Omit');
    }

    const { data, count, error } = await query;

    if (error) {
      console.error('Failed to fetch deals:', error.message);
      return { data: [], count: 0 };
    }

    return { data: (data as unknown as DealWithRelations[]) ?? [], count: count ?? 0 };
  },
);
