import { cache } from 'react';
import { logger } from '@/lib/logger';
import { createServerClient } from '@/lib/supabase/server';
import type { SlaRateWithTools } from '../types';

export const getSlaRates = cache(
  async (accountId: string, years?: number[]): Promise<SlaRateWithTools[]> => {
    const supabase = await createServerClient();

    let query = supabase
      .from('sla_rates')
      .select('*, tools:sla_tools(*)')
      .eq('account_id', accountId)
      .order('year', { ascending: false });

    if (years) {
      query = query.in('year', years);
    }

    const { data, error } = await query;

    if (error) {
      logger.error({ err: error, entity: 'sla_rates' }, 'Failed to fetch SLA rates');
      return [];
    }

    return (data ?? []) as SlaRateWithTools[];
  },
);
