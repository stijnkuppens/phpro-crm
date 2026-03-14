import { cache } from 'react';
import { createServerClient } from '@/lib/supabase/server';
import type { HourlyRate } from '../types';

export const getHourlyRates = cache(
  async (accountId: string, years?: number[]): Promise<HourlyRate[]> => {
    const supabase = await createServerClient();

    const currentYear = new Date().getFullYear();
    const targetYears = years ?? [currentYear, currentYear - 1, currentYear - 2];

    const { data, error } = await supabase
      .from('hourly_rates')
      .select('*')
      .eq('account_id', accountId)
      .in('year', targetYears)
      .order('year', { ascending: false })
      .order('role', { ascending: true });

    if (error) {
      console.error('Failed to fetch hourly rates:', error.message);
      return [];
    }

    return data ?? [];
  },
);
