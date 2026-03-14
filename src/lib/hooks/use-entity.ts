'use client';

import { useState, useCallback } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import type { Database } from '@/types/database';

type TableName = keyof Database['public']['Tables'];

type UseEntityOptions<T> = {
  table: TableName;
  pageSize?: number;
  initialData?: T[];
  initialCount?: number;
};

export function useEntity<T extends Record<string, unknown>>({
  table,
  pageSize = 10,
  initialData,
  initialCount,
}: UseEntityOptions<T>) {
  const supabase = createBrowserClient();
  // Targeted cast: .from() with a dynamic table name returns a union type that TS
  // can't narrow. We cast the query builder, not the entire client.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const queryTable = (t: TableName) => supabase.from(t) as any;
  const [data, setData] = useState<T[]>(initialData ?? []);
  const [total, setTotal] = useState(initialCount ?? 0);
  const [loading, setLoading] = useState(!initialData);

  const fetchList = useCallback(
    async (params: {
      page?: number;
      sort?: { column: string; direction: 'asc' | 'desc' };
      search?: { column: string; query: string };
      orFilter?: string;
      eqFilters?: Record<string, string>;
    } = {}) => {
      setLoading(true);
      const { page = 1, sort, search, orFilter, eqFilters } = params;
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = queryTable(table)
        .select('*', { count: 'exact' })
        .range(from, to);

      if (sort) {
        query = query.order(sort.column, { ascending: sort.direction === 'asc' });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      if (search?.query) {
        query = query.ilike(search.column, `%${search.query}%`);
      }

      if (orFilter) {
        query = query.or(orFilter);
      }

      if (eqFilters) {
        for (const [col, val] of Object.entries(eqFilters)) {
          query = query.eq(col, val);
        }
      }

      const { data: rows, count, error } = await query;
      if (error) {
        toast.error(`Failed to load ${table}`);
      } else {
        setData((rows ?? []) as T[]);
        setTotal(count ?? 0);
      }
      setLoading(false);
    },
    [table, pageSize],
  );

  const getById = useCallback(
    async (id: string) => {
      const { data, error } = await queryTable(table)
        .select('*')
        .eq('id', id)
        .single();
      if (error) {
        toast.error(`Failed to load record`);
        return null;
      }
      return data as T;
    },
    [table],
  );

  const create = useCallback(
    async (values: Partial<T>) => {
      const { error } = await queryTable(table).insert(values);
      if (error) {
        toast.error(`Failed to create record`);
        return false;
      }
      toast.success('Record created');
      return true;
    },
    [table],
  );

  const update = useCallback(
    async (id: string, values: Partial<T>) => {
      const { error } = await queryTable(table).update(values).eq('id', id);
      if (error) {
        toast.error(`Failed to update record`);
        return false;
      }
      toast.success('Record updated');
      return true;
    },
    [table],
  );

  const remove = useCallback(
    async (id: string) => {
      const { error } = await queryTable(table).delete().eq('id', id);
      if (error) {
        toast.error(`Failed to delete record`);
        return false;
      }
      toast.success('Record deleted');
      return true;
    },
    [table],
  );

  const bulkDelete = useCallback(
    async (ids: string[]) => {
      const { error } = await queryTable(table).delete().in('id', ids);
      if (error) {
        toast.error(`Failed to delete records`);
        return false;
      }
      toast.success(`${ids.length} records deleted`);
      return true;
    },
    [table],
  );

  return { data, total, loading, fetchList, getById, create, update, remove, bulkDelete };
}
