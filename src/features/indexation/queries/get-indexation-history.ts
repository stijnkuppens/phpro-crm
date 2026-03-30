import { cache } from 'react';
import { logger } from '@/lib/logger';
import { createServerClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database';
import type { IndexationHistory } from '../types';

export type IndexationHistoryFull = IndexationHistory & {
  rates: Database['public']['Tables']['indexation_history_rates']['Row'][];
  sla: Database['public']['Tables']['indexation_history_sla']['Row'] | null;
  sla_tools: Database['public']['Tables']['indexation_history_sla_tools']['Row'][];
};

export const getIndexationHistory = cache(async (accountId: string): Promise<IndexationHistoryFull[]> => {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from('indexation_history')
    .select(`
        *,
        rates:indexation_history_rates(*),
        sla:indexation_history_sla(*),
        sla_tools:indexation_history_sla_tools(*)
      `)
    .eq('account_id', accountId)
    .order('date', { ascending: false })
    .limit(20);

  if (error) {
    logger.error({ err: error, entity: 'indexation_history' }, 'Failed to fetch indexation history');
    return [];
  }

  return (data ?? []) as unknown as IndexationHistoryFull[];
});
