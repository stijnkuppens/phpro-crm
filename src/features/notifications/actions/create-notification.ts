'use server';

import { createServiceRoleClient } from '@/lib/supabase/admin';
import { ok, err, type ActionResult } from '@/lib/action-result';

export async function createNotification(params: {
  userId: string;
  title: string;
  message?: string;
  link?: string;
}): Promise<ActionResult> {
  const admin = createServiceRoleClient();
  const { error } = await admin.from('notifications').insert({
    user_id: params.userId,
    title: params.title,
    message: params.message ?? null,
    link: params.link ?? null,
  });

  if (error) {
    return err(error.message);
  }

  return ok();
}
