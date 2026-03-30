'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { type ActionResult, err, ok } from '@/lib/action-result';
import { logger } from '@/lib/logger';
import { requirePermission } from '@/lib/require-permission';
import { createServiceRoleClient } from '@/lib/supabase/admin';

const paramsSchema = z.object({
  id: z.string().min(1),
  path: z.string().min(1),
});

export async function updateUserAvatar(id: string, path: string): Promise<ActionResult> {
  try {
    await requirePermission('users.write');
  } catch {
    return err('Onvoldoende rechten');
  }

  const parsed = paramsSchema.safeParse({ id, path });
  if (!parsed.success) return err('Ongeldige invoer');

  const admin = createServiceRoleClient();

  // Update profile table and sync to auth metadata so the topbar avatar updates
  const [{ error }, { error: authError }] = await Promise.all([
    admin.from('user_profiles').update({ avatar_url: parsed.data.path }).eq('id', parsed.data.id),
    admin.auth.admin.updateUserById(parsed.data.id, {
      user_metadata: { avatar_url: parsed.data.path },
    }),
  ]);

  if (error || authError) {
    logger.error({ err: error ?? authError }, '[updateUserAvatar] database error');
    return err('Er is een fout opgetreden');
  }

  revalidatePath('/admin/users');
  revalidatePath(`/admin/users/${id}`);
  return ok(undefined);
}
