import { cache } from 'react';
import { createServerClient } from '@/lib/supabase/server';
import type { TaskWithRelations, TaskFilters } from '../types';

type GetTasksParams = {
  filters?: TaskFilters;
  page?: number;
  pageSize?: number;
};

export const getTasks = cache(
  async ({
    filters,
    page = 1,
    pageSize = 25,
  }: GetTasksParams = {}): Promise<{ data: TaskWithRelations[]; count: number }> => {
    const supabase = await createServerClient();
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from('tasks')
      .select(`
        *,
        account:accounts!account_id(id, name),
        deal:deals!deal_id(id, title),
        assignee:user_profiles!assigned_to(id, full_name)
      `, { count: 'exact' })
      .order('due_date', { ascending: true, nullsFirst: false })
      .range(from, to);

    if (filters?.status) {
      query = query.eq('status', filters.status as 'Open' | 'In Progress' | 'Done');
    }
    if (filters?.priority) {
      query = query.eq('priority', filters.priority as 'High' | 'Medium' | 'Low');
    }
    if (filters?.assigned_to) {
      query = query.eq('assigned_to', filters.assigned_to);
    }
    if (filters?.deal_id) {
      query = query.eq('deal_id', filters.deal_id);
    }

    const { data, count, error } = await query;

    if (error) {
      console.error('Failed to fetch tasks:', error.message);
      return { data: [], count: 0 };
    }

    return { data: (data as unknown as TaskWithRelations[]) ?? [], count: count ?? 0 };
  },
);
