import { cache } from 'react';
import { createServerClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import type { RevenueEntry } from '../types';

type GetRevenueEntriesParams = {
  year?: number;
  years?: number[];
  divisionId?: string;
  revenueClientId?: string;
};

export const getRevenueEntries = cache(
  async (params: GetRevenueEntriesParams = {}): Promise<RevenueEntry[]> => {
    const supabase = await createServerClient();
    let query = supabase.from('revenue_entries').select('*')
      .order('year', { ascending: true }).order('month', { ascending: true });
    if (params.year) query = query.eq('year', params.year);
    if (params.years && params.years.length > 0) query = query.in('year', params.years);
    if (params.divisionId) query = query.eq('division_id', params.divisionId);
    if (params.revenueClientId) query = query.eq('revenue_client_id', params.revenueClientId);
    const { data, error } = await query;
    if (error) { logger.error({ err: error, entity: 'revenue_entries' }, 'Failed to fetch revenue entries'); return []; }
    return data ?? [];
  },
);
