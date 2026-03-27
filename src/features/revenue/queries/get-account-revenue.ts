import { cache } from 'react';
import { createServerClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import type { AccountRevenue } from '../types';

export const getAccountRevenue = cache(
  async (accountId: string): Promise<AccountRevenue[]> => {
    const supabase = await createServerClient();
    const { data, error } = await supabase
      .from('account_revenue').select('*')
      .eq('account_id', accountId)
      .order('year', { ascending: false }).order('category', { ascending: true });
    if (error) { logger.error({ err: error, entity: 'account_revenue' }, 'Failed to fetch account revenue'); return []; }
    return data ?? [];
  },
);
