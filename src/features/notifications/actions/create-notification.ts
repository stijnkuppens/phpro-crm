'use server';

import { revalidatePath } from 'next/cache';
import { requirePermission } from '@/lib/require-permission';
import { createServiceRoleClient } from '@/lib/supabase/admin';
import { ok, err, type ActionResult } from '@/lib/action-result';
import { createNotificationSchema } from '@/features/notifications/types';

export async function createNotification(params: {
  userId: string;
  title: string;
  message?: string;
  link?: string;
}): Promise<ActionResult> {
  try {
    await requirePermission('notifications.write');
  } catch {
    return err('Onvoldoende rechten');
  }

  const parsed = createNotificationSchema.safeParse(params);
  if (!parsed.success) return err(parsed.error.flatten().fieldErrors);

  const admin = createServiceRoleClient();
  const { error } = await admin.from('notifications').insert({
    user_id: parsed.data.userId,
    title: parsed.data.title,
    message: parsed.data.message ?? null,
    metadata: parsed.data.link ? { link: parsed.data.link } : {},
  });

  if (error) {
    console.error('[createNotification]', error);
    return err('Er is een fout opgetreden');
  }

  revalidatePath('/admin', 'layout');
  return ok();
}
