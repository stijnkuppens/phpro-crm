import { cache } from 'react';
import { logger } from '@/lib/logger';
import { createServerClient } from '@/lib/supabase/server';
import { escapeSearch } from '@/lib/utils/escape-search';
import type { Account, AccountFilters, AccountListItem } from '../types';

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
  }: GetAccountsParams = {}): Promise<{
    data: AccountListItem[];
    count: number;
  }> => {
    const supabase = await createServerClient();
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from('accounts')
      .select('*, owner:user_profiles!owner_id(id, full_name)', {
        count: 'exact',
      })
      .order('name', { ascending: true })
      .range(from, to);

    if (filters?.search) {
      const s = escapeSearch(filters.search);
      query = query.or(`name.ilike.%${s}%,domain.ilike.%${s}%`);
    }
    if (filters?.type) {
      query = query.eq('type', filters.type as Account['type']);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status as Account['status']);
    }
    if (filters?.owner_id) {
      query = query.eq('owner_id', filters.owner_id);
    }
    if (filters?.country) {
      query = query.eq('country', filters.country);
    }

    const { data, count, error } = await query;

    if (error) {
      logger.error({ err: error, entity: 'accounts' }, 'Failed to fetch accounts');
      return { data: [], count: 0 };
    }

    return {
      data: (data as unknown as AccountListItem[]) ?? [],
      count: count ?? 0,
    };
  },
);
