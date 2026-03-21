'use server';

import { createServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/require-permission';
import { logAction } from '@/features/audit/actions/log-action';
import { revalidatePath } from 'next/cache';
import { ok, err, type ActionResult } from '@/lib/action-result';

export async function deleteActivity(id: string): Promise<ActionResult> {
  try {
    await requirePermission('activities.delete');
  } catch {
    return err('Onvoldoende rechten');
  }

  const supabase = await createServerClient();
  const { error } = await supabase
    .from('activities')
    .delete()
    .eq('id', id);

  if (error) {
    return err(error.message);
  }

  await logAction({
    action: 'activity.deleted',
    entityType: 'activity',
    entityId: id,
  });

  revalidatePath('/admin/activities');
  return ok();
}
