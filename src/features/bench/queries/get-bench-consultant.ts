import { cache } from 'react';
import { createServerClient } from '@/lib/supabase/server';
import type { BenchConsultantWithLanguages } from '../types';

export const getBenchConsultant = cache(
  async (id: string): Promise<BenchConsultantWithLanguages | null> => {
    const supabase = await createServerClient();
    const { data, error } = await supabase
      .from('bench_consultants')
      .select('*, languages:bench_consultant_languages(*)')
      .eq('id', id)
      .single();
    if (error) {
      console.error('Failed to fetch bench consultant:', error.message);
      return null;
    }
    return data as unknown as BenchConsultantWithLanguages;
  },
);
