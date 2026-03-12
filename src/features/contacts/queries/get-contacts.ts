import { cache } from 'react';
import { createServerClient } from '@/lib/supabase/server';
import type { Contact } from '../types';

export const getContacts = cache(
  async (params: { page?: number; pageSize?: number; search?: string } = {}) => {
    const { page = 1, pageSize = 10, search } = params;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const supabase = await createServerClient();

    let query = supabase
      .from('contacts')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    const { data, count, error } = await query;

    if (error) throw new Error(error.message);

    return { data: (data ?? []) as Contact[], count: count ?? 0 };
  },
);
