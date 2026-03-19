import { cache } from 'react';
import { createServerClient } from '@/lib/supabase/server';
import type { PipelineEntryWithDivision } from '../types';

export const getPipelineEntries = cache(
  async (year: number): Promise<PipelineEntryWithDivision[]> => {
    const supabase = await createServerClient();
    const { data, error } = await supabase
      .from('pipeline_entries')
      .select(`*, division:divisions!division_id(id, name, color)`)
      .eq('year', year)
      .order('client', { ascending: true });
    if (error) { console.error('Failed to fetch pipeline entries:', error.message); return []; }
    return (data as unknown as PipelineEntryWithDivision[]) ?? [];
  },
);
