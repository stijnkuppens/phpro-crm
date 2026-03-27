import { cache } from 'react';
import { createServerClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import type { IndexationDraftFull } from '../types';

export const getIndexationDraft = cache(
  async (accountId: string): Promise<IndexationDraftFull | null> => {
    const supabase = await createServerClient();

    const { data, error } = await supabase
      .from('indexation_drafts')
      .select(`
        *,
        rates:indexation_draft_rates(*),
        sla:indexation_draft_sla(*),
        sla_tools:indexation_draft_sla_tools(*)
      `)
      .eq('account_id', accountId)
      .eq('status', 'draft')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      logger.error({ err: error, entity: 'indexation_drafts' }, 'Failed to fetch indexation draft');
      return null;
    }

    return data as unknown as IndexationDraftFull | null;
  },
);
