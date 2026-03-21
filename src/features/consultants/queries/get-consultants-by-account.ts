import { cache } from 'react';
import { createServerClient } from '@/lib/supabase/server';
import { CONSULTANT_SELECT, type ConsultantWithDetails } from '../types';

export const getConsultantsByAccount = cache(
  async (accountId: string): Promise<ConsultantWithDetails[]> => {
    const supabase = await createServerClient();
    const { data, error } = await supabase
      .from('consultants')
      .select(CONSULTANT_SELECT)
      .eq('account_id', accountId)
      .eq('status', 'actief')
      .order('last_name', { ascending: true });

    if (error) {
      console.error('Failed to fetch consultants by account:', error.message);
      return [];
    }

    return (data as unknown as ConsultantWithDetails[]) ?? [];
  },
);
