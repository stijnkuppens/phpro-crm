import { cache } from 'react';
import { createServerClient } from '@/lib/supabase/server';
import type { HourlyRate } from '../types';

export const getHourlyRates = cache(
  async (accountId: string, years?: number[]): Promise<HourlyRate[]> => {
    const supabase = await createServerClient();

    let query = supabase
      .from('hourly_rates')
      .select('*')
      .eq('account_id', accountId)
      .order('year', { ascending: false })
      .order('role', { ascending: true });

    if (years) {
      query = query.in('year', years);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Failed to fetch hourly rates:', error.message);
      return [];
    }

    return data ?? [];
  },
);
