import { cache } from 'react';
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
      console.error('Failed to fetch SLA rates:', error.message);
      return [];
    }

    return (data ?? []) as SlaRateWithTools[];
  },
);
