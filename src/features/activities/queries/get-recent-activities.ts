import { cache } from 'react';
import { createServerClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

export const getRecentActivities = cache(async () => {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('activities')
    .select('id, type, subject, date')
    .order('date', { ascending: false })
    .limit(10);
  if (error) {
    logger.error({ err: error, entity: 'activities' }, 'Failed to fetch recent activities');
    return [];
  }
  return data;
});
