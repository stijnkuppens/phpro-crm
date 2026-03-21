import { cache } from 'react';
import { createServerClient } from '@/lib/supabase/server';
import { CONSULTANT_SELECT, type ActiveConsultantWithDetails } from '../types';

type GetActiveConsultantsParams = {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
};

export const getActiveConsultants = cache(
  async ({
    page = 1,
    pageSize = 25,
    search,
    status,
  }: GetActiveConsultantsParams = {}): Promise<{
    data: ActiveConsultantWithDetails[];
    count: number;
  }> => {
    const supabase = await createServerClient();
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from('active_consultants')
      .select(CONSULTANT_SELECT, { count: 'exact' })
      .order('is_stopped', { ascending: true })
      .order('last_name', { ascending: true })
      .range(from, to);

    if (search) {
      query = query.or(
        `first_name.ilike.%${search}%,last_name.ilike.%${search}%,role.ilike.%${search}%,client_name.ilike.%${search}%`,
      );
    }

    if (status) {
      const today = new Date().toISOString().split('T')[0];
      const in60 = new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0];
      const in120 = new Date(Date.now() + 120 * 86400000).toISOString().split('T')[0];

      switch (status) {
        case 'stopgezet':
          query = query.eq('is_stopped', true);
          break;
        case 'onbepaald':
          query = query.eq('is_stopped', false).or('is_indefinite.eq.true,end_date.is.null');
          break;
        case 'verlopen':
          query = query.eq('is_stopped', false).eq('is_indefinite', false).lt('end_date', today);
          break;
        case 'kritiek':
          query = query.eq('is_stopped', false).eq('is_indefinite', false).gte('end_date', today).lte('end_date', in60);
          break;
        case 'waarschuwing':
          query = query.eq('is_stopped', false).eq('is_indefinite', false).gt('end_date', in60).lte('end_date', in120);
          break;
        case 'actief':
          query = query.eq('is_stopped', false).eq('is_indefinite', false).gt('end_date', in120);
          break;
      }
    }

    const { data, count, error } = await query;

    if (error) {
      console.error('Failed to fetch active consultants:', error.message);
      return { data: [], count: 0 };
    }

    return {
      data: (data as unknown as ActiveConsultantWithDetails[]) ?? [],
      count: count ?? 0,
    };
  },
);
