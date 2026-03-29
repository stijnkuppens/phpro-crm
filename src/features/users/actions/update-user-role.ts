'use server';

import { revalidatePath } from 'next/cache';
import { requirePermission } from '@/lib/require-permission';
import { createServiceRoleClient } from '@/lib/supabase/admin';
import { logAction } from '@/features/audit/actions/log-action';
import { ok, err, type ActionResult } from '@/lib/action-result';
import type { Role } from '@/types/acl';

export async function updateUserRole(userId: string, newRole: Role): Promise<ActionResult> {
  try {
    await requirePermission('users.write');
  } catch {
    return err('Onvoldoende rechten');
  }
  const admin = createServiceRoleClient();
  const { error } = await admin
    .from('user_profiles')
    .update({ role: newRole })
    .eq('id', userId);

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
