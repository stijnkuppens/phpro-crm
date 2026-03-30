import { cache } from 'react';
import { logger } from '@/lib/logger';
import { createServerClient } from '@/lib/supabase/server';
import { escapeSearch } from '@/lib/utils/escape-search';
import type { Contact, ContactFilters, ContactWithDetails } from '../types';

type GetContactsParams = {
  filters?: ContactFilters;
  page?: number;
  pageSize?: number;
};

export const getContacts = cache(
  async ({
    filters,
    page = 1,
    pageSize = 25,
  }: GetContactsParams = {}): Promise<{ data: ContactWithDetails[]; count: number }> => {
    const supabase = await createServerClient();
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from('contacts')
      .select(
        `
        *,
        account:accounts!account_id(id, name)
      `,
        { count: 'exact' },
      )
      .order('last_name', { ascending: true })
      .range(from, to);

    if (filters?.search) {
      const s = escapeSearch(filters.search);
      query = query.or(`first_name.ilike.%${s}%,last_name.ilike.%${s}%,email.ilike.%${s}%`);
    }
    if (filters?.account_id) {
      query = query.eq('account_id', filters.account_id);
    }
    if (filters?.role) {
      query = query.eq('role', filters.role as NonNullable<Contact['role']>);
    }
    if (filters?.is_steerco !== undefined) {
      query = query.eq('is_steerco', filters.is_steerco);
    }

    const { data, count, error } = await query;

    if (error) {
      logger.error({ err: error, entity: 'contacts' }, 'Failed to fetch contacts');
      return { data: [], count: 0 };
    }

    return { data: (data as unknown as ContactWithDetails[]) ?? [], count: count ?? 0 };
  },
);
