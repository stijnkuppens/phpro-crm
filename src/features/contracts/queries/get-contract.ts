import { cache } from 'react';
import { createServerClient } from '@/lib/supabase/server';
import type { Contract } from '../types';

export const getContract = cache(
  async (accountId: string): Promise<Contract | null> => {
    const supabase = await createServerClient();

    const { data, error } = await supabase
      .from('contracts')
      .select('*')
      .eq('account_id', accountId)
      .maybeSingle();

    if (error) {
      console.error('Failed to fetch contract:', error.message);
      return null;
    }

    return data;
  },
);
