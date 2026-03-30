import { cache } from 'react';
import { createServerClient } from '@/lib/supabase/server';
import type { Notification } from '../types';

export const getNotifications = cache(async (): Promise<Notification[]> => {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20);

  return (data as Notification[]) ?? [];
});
