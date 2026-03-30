import { cache } from 'react';
import { createServerClient } from '@/lib/supabase/server';
import type { Notification } from '../types';

export const getNotifications = cache(async () => {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { data: [] as Notification[], count: 0 };

  const { data, count } = await supabase
    .from('notifications')
    .select('*', { count: 'exact' })
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(0, 24);

  return {
    data: (data as Notification[]) ?? [],
    count: count ?? 0,
  };
});
