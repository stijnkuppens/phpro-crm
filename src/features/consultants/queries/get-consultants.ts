import { cache } from 'react';
import { logger } from '@/lib/logger';
import { createServerClient } from '@/lib/supabase/server';
import { escapeSearch } from '@/lib/utils/escape-search';
import { CONSULTANT_SELECT, type ConsultantStatus, type ConsultantWithDetails } from '../types';

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
      const s = escapeSearch(search);
      query = query.or(
        `first_name.ilike.%${s}%,last_name.ilike.%${s}%,role.ilike.%${s}%,client_name.ilike.%${s}%`,
      );
    }

    const { data, count, error } = await query;

    if (error) {
      logger.error({ err: error, entity: 'consultants' }, 'Failed to fetch consultants');
      return { data: [], count: 0 };
    }

    return {
      data: (data as unknown as ConsultantWithDetails[]) ?? [],
      count: count ?? 0,
    };
  },
);
