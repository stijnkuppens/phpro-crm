import { cache } from 'react';
import { createServerClient } from '@/lib/supabase/server';

export const getPipelines = cache(async () => {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('pipelines')
    .select(`
      id, name, type,
      stages:pipeline_stages(id, name, color, sort_order, is_closed, is_won, is_longterm, probability)
    `)
    .order('sort_order', { ascending: true });
  if (error) {
    console.error('getPipelines error:', error.message);
    return [];
  }
  return data ?? [];
});
