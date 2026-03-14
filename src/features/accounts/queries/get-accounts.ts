import { cache } from 'react';
import { createServerClient } from '@/lib/supabase/server';
import type { Account, AccountFilters } from '../types';

type GetAccountsParams = {
  filters?: AccountFilters;
  page?: number;
  pageSize?: number;
};

export const getAccounts = cache(
  async ({
    filters,
    page = 1,
    pageSize = 25,
  }: GetAccountsParams = {}): Promise<{ data: Account[]; count: number }> => {
    const supabase = await createServerClient();
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from('accounts')
      .select('*, owner:user_profiles!owner_id(id, full_name)', { count: 'exact' })
      .order('name', { ascending: true })
      .range(from, to);

    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,domain.ilike.%${filters.search}%`);
    }
    if (filters?.type) {
      query = query.eq('type', filters.type);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.owner_id) {
      query = query.eq('owner_id', filters.owner_id);
    }
    if (filters?.country) {
      query = query.eq('country', filters.country);
    }

    const { data, count, error } = await query;

    if (error) {
      console.error('Failed to fetch accounts:', error.message);
      return { data: [], count: 0 };
    }

    return { data: (data as Account[]) ?? [], count: count ?? 0 };
  },
);
