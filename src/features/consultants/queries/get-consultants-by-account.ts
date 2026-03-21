import { cache } from 'react';
import { createServerClient } from '@/lib/supabase/server';
import { CONSULTANT_SELECT, type ActiveConsultantWithDetails } from '../types';

export const getConsultantsByAccount = cache(
  async (accountId: string): Promise<ActiveConsultantWithDetails[]> => {
    const supabase = await createServerClient();
    const { data, error } = await supabase
      .from('active_consultants')
      .select(CONSULTANT_SELECT)
      .eq('account_id', accountId)
      .order('is_stopped', { ascending: true })
      .order('last_name', { ascending: true });

    if (error) {
      console.error('Failed to fetch consultants by account:', error.message);
      return [];
    }

    return (data as unknown as ActiveConsultantWithDetails[]) ?? [];
  },
);
