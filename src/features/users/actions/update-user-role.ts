'use server';

import { requirePermission } from '@/lib/require-permission';
import { createServiceRoleClient } from '@/lib/supabase/admin';

export async function updateUserRole(userId: string, newRole: string) {
  await requirePermission('users.write');
  const admin = createServiceRoleClient();
  const { error } = await admin
    .from('user_profiles')
    .update({ role: newRole })
    .eq('id', userId);
  if (error) throw new Error(error.message);
  // TODO: logAction()
}
