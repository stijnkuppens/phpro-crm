import { cache } from 'react';
import { createServerClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { CONSULTANT_SELECT, type ConsultantWithDetails } from '../types';

export const getConsultantsByAccount = cache(
  async (accountId: string, includeArchived = false): Promise<ConsultantWithDetails[]> => {
    const supabase = await createServerClient();
    let query = supabase
      .from('consultants')
      .select(CONSULTANT_SELECT)
      .eq('account_id', accountId)
      .order('last_name', { ascending: true });

    if (!includeArchived) {
      query = query.eq('is_archived', false);
    }

    const { data, error } = await query;

    if (error) {
      logger.error({ err: error, entity: 'consultants' }, 'Failed to fetch consultants by account');
      return [];
    }

    return (data as unknown as ConsultantWithDetails[]) ?? [];
  },
);
