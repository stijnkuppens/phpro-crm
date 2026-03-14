import { cache } from 'react';
import { createServerClient } from '@/lib/supabase/server';
import type { IndexationConfig } from '../types';

export const getIndexationConfig = cache(
  async (accountId: string): Promise<IndexationConfig | null> => {
    const supabase = await createServerClient();

    const { data, error } = await supabase
      .from('indexation_config')
      .select('*')
      .eq('account_id', accountId)
      .maybeSingle();

    if (error) {
      console.error('Failed to fetch indexation config:', error.message);
      return null;
    }

    return data;
  },
);
