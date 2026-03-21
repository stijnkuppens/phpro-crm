import { cache } from 'react';
import { createServerClient } from '@/lib/supabase/server';
import type { BenchConsultantWithLanguages } from '../types';

export const getBenchConsultants = cache(
  async (includeArchived = false): Promise<BenchConsultantWithLanguages[]> => {
    const supabase = await createServerClient();
    let query = supabase
      .from('bench_consultants')
      .select('*, languages:bench_consultant_languages(*)')
      // Primary sort is by available_date; priority sort is applied in JS below
      // because Supabase .order() doesn't support CASE expressions.
      .order('available_date', { ascending: true })
      .limit(500); // safety net — bench is typically small
    if (!includeArchived) {
      query = query.eq('is_archived', false);
    }
    const { data, error } = await query;
    if (error) {
      console.error('Failed to fetch bench consultants:', error.message);
      return [];
    }
    // Sort by priority first (High → Medium → Low), then by available_date (already ordered by DB).
    // JS sort is stable in V8, so within the same priority tier the DB order is preserved.
    const priorityOrder: Record<string, number> = { High: 1, Medium: 2, Low: 3 };
    return (data as unknown as BenchConsultantWithLanguages[])?.sort(
      (a, b) => (priorityOrder[a.priority] ?? 99) - (priorityOrder[b.priority] ?? 99),
    ) ?? [];
  },
);
