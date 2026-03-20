import { cache } from 'react';
import { createServerClient } from '@/lib/supabase/server';
import type { AccountRevenue } from '../types';

export const getAccountRevenue = cache(
  async (accountId: string): Promise<AccountRevenue[]> => {
    const supabase = await createServerClient();
    const { data, error } = await supabase
      .from('account_revenue').select('*')
      .eq('account_id', accountId)
      .order('year', { ascending: false }).order('category', { ascending: true });
    if (error) { console.error('Failed to fetch account revenue:', error.message); return []; }
    return data ?? [];
  },
);
