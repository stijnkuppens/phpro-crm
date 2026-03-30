import { cache } from 'react';
import { logger } from '@/lib/logger';
import { createServerClient } from '@/lib/supabase/server';
import type { ContactWithDetails } from '../types';

export const getContactsByAccount = cache(
  async (accountId: string): Promise<ContactWithDetails[]> => {
    const supabase = await createServerClient();

    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('account_id', accountId)
      .order('is_pinned', { ascending: false })
      .order('last_name', { ascending: true });

    if (error) {
      logger.error({ err: error, entity: 'contacts' }, 'Failed to fetch contacts by account');
      return [];
    }

    return (data as unknown as ContactWithDetails[]) ?? [];
  },
);
