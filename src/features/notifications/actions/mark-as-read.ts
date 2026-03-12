'use server';
import { createServerClient } from '@/lib/supabase/server';

export async function markAsRead(notificationId: string): Promise<void> {
  const supabase = await createServerClient();
  await supabase.from('notifications').update({ is_read: true }).eq('id', notificationId);
}

export async function markAllAsRead(): Promise<void> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false);
}
