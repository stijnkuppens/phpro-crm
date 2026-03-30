'use server';

import { revalidatePath } from 'next/cache';
import { logAction } from '@/features/audit/actions/log-action';
import { updateRoleSchema } from '@/features/users/types';
import { type ActionResult, err, ok } from '@/lib/action-result';
import { logger } from '@/lib/logger';
import { requirePermission } from '@/lib/require-permission';
import { createServiceRoleClient } from '@/lib/supabase/admin';

export async function updateUserRole(userId: string, newRole: string): Promise<ActionResult> {
  try {
    await requirePermission('users.write');
  } catch {
    return err('Onvoldoende rechten');
  }

  const parsed = updateRoleSchema.safeParse({ userId, newRole });
  if (!parsed.success) return err('Ongeldige rol');

  const admin = createServiceRoleClient();
  const { data: before } = await admin.from('user_profiles').select('*').eq('id', parsed.data.userId).single();
  const { error } = await admin
    .from('user_profiles')
    .update({ role: parsed.data.newRole })
    .eq('id', parsed.data.userId);

  if (error) {
    logger.error({ err: error }, '[updateUserRole] database error');
    return err('Er is een fout opgetreden');
  }

  await logAction({
    action: 'user.role_changed',
    entityType: 'user',
    entityId: userId,
    metadata: { newRole, before },
  });

  revalidatePath('/admin/users');
  revalidatePath(`/admin/users/${userId}`);
  return ok();
}
