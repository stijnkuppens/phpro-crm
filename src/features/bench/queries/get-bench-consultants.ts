import { cache } from 'react';
import { createServerClient } from '@/lib/supabase/server';
import type { BenchConsultantWithLanguages } from '../types';

export const getBenchConsultants = cache(
  async (includeArchived = false): Promise<BenchConsultantWithLanguages[]> => {
    const supabase = await createServerClient();
    let query = supabase
      .from('bench_consultants')
      .select('*, languages:bench_consultant_languages(*)')
      .order('available_date', { ascending: true });
    if (!includeArchived) {
      query = query.eq('is_archived', false);
    }
    const { data, error } = await query;
    if (error) {
      console.error('Failed to fetch bench consultants:', error.message);
      return [];
    }
    const priorityOrder: Record<string, number> = { High: 1, Medium: 2, Low: 3 };
    return (data as unknown as BenchConsultantWithLanguages[])?.sort(
      (a, b) => (priorityOrder[a.priority] ?? 99) - (priorityOrder[b.priority] ?? 99),
    ) ?? [];
  },
);
