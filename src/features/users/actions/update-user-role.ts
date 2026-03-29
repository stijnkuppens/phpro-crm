'use server';

import { revalidatePath } from 'next/cache';
import { requirePermission } from '@/lib/require-permission';
import { createServiceRoleClient } from '@/lib/supabase/admin';
import { logAction } from '@/features/audit/actions/log-action';
import { ok, err, type ActionResult } from '@/lib/action-result';
import { updateRoleSchema } from '@/features/users/types';

export async function updateUserRole(userId: string, newRole: string): Promise<ActionResult> {
  try {
    await requirePermission('users.write');
  } catch {
    return err('Onvoldoende rechten');
  }

  const parsed = updateRoleSchema.safeParse({ userId, newRole });
  if (!parsed.success) return err('Ongeldige rol');

  const admin = createServiceRoleClient();
  const { error } = await admin
    .from('user_profiles')
    .update({ role: parsed.data.newRole })
    .eq('id', parsed.data.userId);

  if (error) {
    return err(error.message);
  }

  await logAction({
    action: 'user.role_changed',
    entityType: 'user',
    entityId: userId,
    metadata: { newRole },
  });

  revalidatePath('/admin/users');
  revalidatePath(`/admin/users/${userId}`);
  return ok();
}
