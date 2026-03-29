import { cache } from 'react';
import { createServerClient } from '@/lib/supabase/server';
import type { Job } from '../types';

export const getJobs = cache(async (): Promise<{ data: Job[]; count: number }> => {
  const supabase = await createServerClient();

  const { data, count, error } = await supabase
    .from('jobs')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(0, 49);

  if (error) {
    return { data: [], count: 0 };
  }

  return { data: (data as unknown as Job[]) ?? [], count: count ?? 0 };
});
