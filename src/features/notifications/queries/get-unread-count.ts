import { cache } from 'react';
import { createServerClient } from '@/lib/supabase/server';

export const getUnreadCount = cache(async (): Promise<number> => {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  const { count } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_read', false);

  return count ?? 0;
});
