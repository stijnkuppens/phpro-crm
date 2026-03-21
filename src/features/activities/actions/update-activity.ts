'use server';

import { createServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/require-permission';
import { logAction } from '@/features/audit/actions/log-action';
import { revalidatePath } from 'next/cache';
import { activityFormSchema, type ActivityFormValues } from '../types';
import { ok, err, type ActionResult } from '@/lib/action-result';

export async function updateActivity(id: string, values: ActivityFormValues): Promise<ActionResult> {
  try {
    await requirePermission('activities.write');
  } catch {
    return err('Onvoldoende rechten');
  }

  const parsed = activityFormSchema.safeParse(values);
  if (!parsed.success) {
    return err(parsed.error.flatten().fieldErrors);
  }

  const supabase = await createServerClient();
  const { error } = await supabase
    .from('activities')
    .update(parsed.data)
    .eq('id', id);

  if (error) {
    return err(error.message);
  }

  await logAction({
    action: 'activity.updated',
    entityType: 'activity',
    entityId: id,
  });

  revalidatePath('/admin/activities');
  return ok();
}
