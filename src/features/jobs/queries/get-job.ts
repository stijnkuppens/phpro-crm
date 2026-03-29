import { cache } from 'react';
import { createServerClient } from '@/lib/supabase/server';
import type { Job } from '../types';

export const getJob = cache(async (id: string): Promise<Job | null> => {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return null;

  return data as unknown as Job;
});
