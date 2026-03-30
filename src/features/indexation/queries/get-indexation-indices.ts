import { cache } from 'react';
import { logger } from '@/lib/logger';
import { createServerClient } from '@/lib/supabase/server';
import type { IndexationIndex } from '../types';

export const getIndexationIndices = cache(async (): Promise<IndexationIndex[]> => {
  const supabase = await createServerClient();

  const { data, error } = await supabase.from('indexation_indices').select('*').order('name', { ascending: true });

  if (error) {
    logger.error({ err: error, entity: 'indexation_indices' }, 'Failed to fetch indexation indices');
    return [];
  }

  return data ?? [];
});
