'use server';
import { revalidatePath } from 'next/cache';
import { createServerClient } from '@/lib/supabase/server';
import { ok, err, type ActionResult } from '@/lib/action-result';

export async function markAsRead(notificationId: string): Promise<ActionResult> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return err('Niet ingelogd');

  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId)
    .eq('user_id', user.id);

  if (error) return err(error.message);
  revalidatePath('/admin', 'layout');
  return ok();
}

export async function markAllAsRead(): Promise<ActionResult> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return err('Niet ingelogd');

  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', user.id)
    .eq('read', false);

  if (error) return err(error.message);
  revalidatePath('/admin', 'layout');
  return ok();
}
