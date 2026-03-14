import { cache } from 'react';
import { createServerClient } from '@/lib/supabase/server';
import type { IndexationIndex } from '../types';

export const getIndexationIndices = cache(
  async (): Promise<IndexationIndex[]> => {
    const supabase = await createServerClient();

    const { data, error } = await supabase
      .from('indexation_indices')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Failed to fetch indexation indices:', error.message);
      return [];
    }

    return data ?? [];
  },
);
