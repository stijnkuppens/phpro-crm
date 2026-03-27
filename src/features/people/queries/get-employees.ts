import { cache } from 'react';
import { createServerClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { escapeSearch } from '@/lib/utils/escape-search';
import type { Employee, EmployeeFilters } from '../types';

type GetEmployeesParams = {
  filters?: EmployeeFilters;
  page?: number;
  pageSize?: number;
};

export const getEmployees = cache(
  async ({ filters, page = 1, pageSize = 25 }: GetEmployeesParams = {}): Promise<{ data: Employee[]; count: number }> => {
    const supabase = await createServerClient();
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase.from('employees').select('*', { count: 'exact' }).order('last_name', { ascending: true }).range(from, to);

    if (filters?.search) {
      const s = escapeSearch(filters.search);
      query = query.or(`first_name.ilike.%${s}%,last_name.ilike.%${s}%,email.ilike.%${s}%`);
    }
    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.department) query = query.eq('department', filters.department);

    const { data, count, error } = await query;
    if (error) { logger.error({ err: error, entity: 'employees' }, 'Failed to fetch employees'); return { data: [], count: 0 }; }
    return { data: data ?? [], count: count ?? 0 };
  },
);
