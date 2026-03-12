'use server';

import { requirePermission } from '@/lib/require-permission';
import { createServiceRoleClient } from '@/lib/supabase/admin';
import { logAction } from '@/features/audit/actions/log-action';
import type { Role } from '@/types/acl';

export async function updateUserRole(userId: string, newRole: Role) {
  await requirePermission('users.write');
  const admin = createServiceRoleClient();
  const { error } = await admin
    .from('user_profiles')
    .update({ role: newRole })
    .eq('id', userId);
  if (error) throw new Error(error.message);

  await logAction({
    action: 'user.role_changed',
    entityType: 'user',
    entityId: userId,
    metadata: { newRole },
  });
}
