import { cache } from 'react';
import { createServerClient } from '@/lib/supabase/server';
import type { Communication, CommunicationWithDetails, CommunicationFilters } from '../types';

type GetCommunicationsParams = {
  filters?: CommunicationFilters;
  page?: number;
  pageSize?: number;
};

export const getCommunications = cache(
  async ({
    filters,
    page = 1,
    pageSize = 25,
  }: GetCommunicationsParams = {}): Promise<{ data: CommunicationWithDetails[]; count: number }> => {
    const supabase = await createServerClient();
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from('communications')
      .select(`
        *,
        contact:contacts!contact_id(id, first_name, last_name),
        owner:user_profiles!owner_id(id, full_name)
      `, { count: 'exact' })
      .order('date', { ascending: false })
      .range(from, to);

    if (filters?.account_id) {
      query = query.eq('account_id', filters.account_id);
    }
    if (filters?.type) {
      query = query.eq('type', filters.type as Communication['type']);
    }
    if (filters?.contact_id) {
      query = query.eq('contact_id', filters.contact_id);
    }

    const { data, count, error } = await query;

    if (error) {
      console.error('Failed to fetch communications:', error.message);
      return { data: [], count: 0 };
    }

    return { data: (data as unknown as CommunicationWithDetails[]) ?? [], count: count ?? 0 };
  },
);
