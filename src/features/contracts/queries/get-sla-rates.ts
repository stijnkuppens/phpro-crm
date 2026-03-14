import { cache } from 'react';
import { createServerClient } from '@/lib/supabase/server';
import type { SlaRateWithTools } from '../types';

export const getSlaRates = cache(
  async (accountId: string, years?: number[]): Promise<SlaRateWithTools[]> => {
    const supabase = await createServerClient();

    const currentYear = new Date().getFullYear();
    const targetYears = years ?? [currentYear, currentYear - 1, currentYear - 2];

    const { data, error } = await supabase
      .from('sla_rates')
      .select('*, tools:sla_tools(*)')
      .eq('account_id', accountId)
      .in('year', targetYears)
      .order('year', { ascending: false });

    if (error) {
      console.error('Failed to fetch SLA rates:', error.message);
      return [];
    }

    return (data ?? []) as SlaRateWithTools[];
  },
);
