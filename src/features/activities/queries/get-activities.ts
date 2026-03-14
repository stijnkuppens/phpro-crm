import { cache } from 'react';
import { createServerClient } from '@/lib/supabase/server';
import type { ActivityWithRelations, ActivityFilters } from '../types';

type GetActivitiesParams = {
  filters?: ActivityFilters;
  page?: number;
  pageSize?: number;
};

export const getActivities = cache(
  async ({
    filters,
    page = 1,
    pageSize = 25,
  }: GetActivitiesParams = {}): Promise<{ data: ActivityWithRelations[]; count: number }> => {
    const supabase = await createServerClient();
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from('activities')
      .select(`
        *,
        account:accounts!account_id(id, name),
        deal:deals!deal_id(id, title),
        owner:user_profiles!owner_id(id, full_name)
      `, { count: 'exact' })
      .order('date', { ascending: false })
      .range(from, to);

    if (filters?.search) {
      query = query.ilike('subject', `%${filters.search}%`);
    }
    if (filters?.type) {
      query = query.eq('type', filters.type as 'Meeting' | 'Demo' | 'Call' | 'E-mail' | 'Lunch' | 'Event');
    }
    if (filters?.account_id) {
      query = query.eq('account_id', filters.account_id);
    }
    if (filters?.is_done !== undefined) {
      query = query.eq('is_done', filters.is_done);
    }

    const { data, count, error } = await query;

    if (error) {
      console.error('Failed to fetch activities:', error.message);
      return { data: [], count: 0 };
    }

    return { data: (data as unknown as ActivityWithRelations[]) ?? [], count: count ?? 0 };
  },
);
