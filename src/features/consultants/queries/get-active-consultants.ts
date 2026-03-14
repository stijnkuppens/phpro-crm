import { cache } from 'react';
import { createServerClient } from '@/lib/supabase/server';
import type { ActiveConsultantWithDetails } from '../types';

export const getActiveConsultants = cache(
  async (): Promise<ActiveConsultantWithDetails[]> => {
    const supabase = await createServerClient();
    const { data, error } = await supabase
      .from('active_consultants')
      .select(
        '*, account:accounts(id, name), rate_history:consultant_rate_history(*), extensions:consultant_extensions(*), contract_attribution:consultant_contract_attributions(*)',
      )
      .order('is_stopped', { ascending: true })
      .order('last_name', { ascending: true });

    if (error) {
      console.error('Failed to fetch active consultants:', error.message);
      return [];
    }

    return (data as unknown as ActiveConsultantWithDetails[]) ?? [];
  },
);
