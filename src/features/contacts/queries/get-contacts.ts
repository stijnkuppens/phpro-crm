import { cache } from 'react';
import { createServerClient } from '@/lib/supabase/server';
import type { Contact, ContactWithDetails, ContactFilters } from '../types';

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
      .select(`
        *,
        personal_info:contact_personal_info(*),
        account:accounts!account_id(id, name)
      `, { count: 'exact' })
      .order('last_name', { ascending: true })
      .range(from, to);

    if (filters?.search) {
      query = query.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
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
      console.error('Failed to fetch contacts:', error.message);
      return { data: [], count: 0 };
    }

    return { data: (data as unknown as ContactWithDetails[]) ?? [], count: count ?? 0 };
  },
);
