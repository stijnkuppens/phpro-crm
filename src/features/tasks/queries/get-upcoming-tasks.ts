import { cache } from 'react';
import { createServerClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

export const getUpcomingTasks = cache(async () => {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('tasks')
    .select('id, title, priority, due_date')
    .neq('status', 'Done')
    .order('due_date', { ascending: true, nullsFirst: false })
    .limit(10);
  if (error) {
    logger.error({ err: error, entity: 'tasks' }, 'Failed to fetch upcoming tasks');
    return [];
  }
  return data;
});
