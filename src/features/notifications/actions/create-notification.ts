'use server';
import { createServiceRoleClient } from '@/lib/supabase/admin';

export async function createNotification(params: {
  userId: string;
  title: string;
  message?: string;
  link?: string;
}): Promise<void> {
  const admin = createServiceRoleClient();
  const { error } = await admin.from('notifications').insert({
    user_id: params.userId,
    title: params.title,
    message: params.message ?? null,
    link: params.link ?? null,
  });
  if (error) throw new Error(error.message);
}
