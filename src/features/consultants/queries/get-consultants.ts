import { cache } from 'react';
import { createServerClient } from '@/lib/supabase/server';
import { CONSULTANT_SELECT, type ConsultantWithDetails, type ConsultantStatus } from '../types';

type GetConsultantsParams = {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: ConsultantStatus[];
  includeArchived?: boolean;
};

export const getConsultants = cache(
  async ({
    page = 1,
    pageSize = 25,
    search,
    status = ['bench', 'actief'],
    includeArchived = false,
  }: GetConsultantsParams = {}): Promise<{
    data: ConsultantWithDetails[];
    count: number;
  }> => {
    const supabase = await createServerClient();
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from('consultants')
      .select(CONSULTANT_SELECT, { count: 'exact' })
      .in('status', status)
      .order('status', { ascending: true })
      .order('last_name', { ascending: true })
      .range(from, to);

    if (!includeArchived) {
      query = query.eq('is_archived', false);
    }

    if (search) {
      query = query.or(
        `first_name.ilike.%${search}%,last_name.ilike.%${search}%,role.ilike.%${search}%,client_name.ilike.%${search}%`,
      );
    }

    const { data, count, error } = await query;

    if (error) {
      console.error('Failed to fetch consultants:', error.message);
      return { data: [], count: 0 };
    }

    return {
      data: (data as unknown as ConsultantWithDetails[]) ?? [],
      count: count ?? 0,
    };
  },
);
