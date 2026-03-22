import { cache } from 'react';
import { createServerClient } from '@/lib/supabase/server';

export const getRecentActivities = cache(async () => {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('activities')
    .select('id, type, subject, date')
    .order('date', { ascending: false })
    .limit(10);
  if (error) {
    console.error('getRecentActivities error:', error.message);
    return [];
  }
  return data;
});
