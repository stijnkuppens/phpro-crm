'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { logAction } from '@/features/audit/actions/log-action';
import { type ActionResult, err, ok } from '@/lib/action-result';
import { logger } from '@/lib/logger';
import { requirePermission } from '@/lib/require-permission';
import { createServiceRoleClient } from '@/lib/supabase/admin';
import { type UpdateUserValues, updateUserSchema } from '../types';

export async function updateUser(userId: string, values: UpdateUserValues): Promise<ActionResult> {
  try {
    await requirePermission('users.write');
  } catch {
    return err('Onvoldoende rechten');
  }

  const parsed = updateUserSchema.safeParse(values);
  if (!parsed.success) {
    return err(z.flattenError(parsed.error).fieldErrors);
  }

  const admin = createServiceRoleClient();

  const { data: before } = await admin.from('user_profiles').select('*').eq('id', userId).single();

  // Update profile table and sync full_name to auth metadata (topbar reads from JWT)
  const [{ error }, { error: authError }] = await Promise.all([
    admin
      .from('user_profiles')
      .update({ full_name: parsed.data.full_name, role: parsed.data.role })
      .eq('id', userId),
    admin.auth.admin.updateUserById(userId, {
      user_metadata: { full_name: parsed.data.full_name },
    }),
  ]);

  if (error || authError) {
    logger.error({ err: error ?? authError }, '[updateUser] database error');
    return err('Er is een fout opgetreden');
  }

  await logAction({
    action: 'user.updated',
    entityType: 'user',
    entityId: userId,
    metadata: { before, after: parsed.data },
  });

  revalidatePath('/admin/users');
  revalidatePath(`/admin/users/${userId}`);
  return ok();
}
