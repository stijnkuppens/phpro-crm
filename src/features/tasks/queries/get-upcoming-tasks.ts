import { cache } from 'react';
import { createServerClient } from '@/lib/supabase/server';

export const getUpcomingTasks = cache(async () => {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('tasks')
    .select('id, title, priority, due_date')
    .neq('status', 'Done')
    .order('due_date', { ascending: true, nullsFirst: false })
    .limit(10);
  if (error) {
    console.error('getUpcomingTasks error:', error.message);
    return [];
  }
  return data;
});
