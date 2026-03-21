import { cache } from 'react';
import { createServerClient } from '@/lib/supabase/server';
import type { AuditLog, AuditLogFilters } from '../types';

type GetAuditLogsParams = {
  filters?: AuditLogFilters;
  page?: number;
  pageSize?: number;
};

export const getAuditLogs = cache(
  async ({
    filters,
    page = 1,
    pageSize = 20,
  }: GetAuditLogsParams = {}): Promise<{ data: AuditLog[]; count: number }> => {
    const supabase = await createServerClient();
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from('audit_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (filters?.action) {
      query = query.eq('action', filters.action);
    }
    if (filters?.entityType) {
      query = query.eq('entity_type', filters.entityType);
    }
    if (filters?.userId) {
      query = query.eq('user_id', filters.userId);
    }
    if (filters?.dateFrom) {
      query = query.gte('created_at', filters.dateFrom);
    }
    if (filters?.dateTo) {
      query = query.lte('created_at', filters.dateTo);
    }

    const { data, count, error } = await query;

    if (error) {
      console.error('Failed to fetch audit logs:', error.message);
      return { data: [], count: 0 };
    }

    return { data: data ?? [], count: count ?? 0 };
  },
);
