import { cache } from 'react';
import { createServerClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
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
      logger.error({ err: error, entity: 'indexation_config' }, 'Failed to fetch indexation config');
      return null;
    }

    return data;
  },
);
