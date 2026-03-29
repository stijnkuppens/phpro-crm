'use server';

import { revalidatePath } from 'next/cache';
import { createServerClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/admin';
import { ok, err, type ActionResult } from '@/lib/action-result';

export async function createNotification(params: {
  userId: string;
  title: string;
  message?: string;
  link?: string;
}): Promise<ActionResult> {
  const supabaseAuth = await createServerClient();
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) return err('Niet ingelogd');

  const admin = createServiceRoleClient();
  const { error } = await admin.from('notifications').insert({
    user_id: params.userId,
    title: params.title,
    message: params.message ?? null,
    metadata: params.link ? { link: params.link } : {},
  });

  if (error) {
    return err(error.message);
  }

  revalidatePath('/admin', 'layout');
  return ok();
}
