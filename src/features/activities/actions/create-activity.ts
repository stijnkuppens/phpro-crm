'use server';

import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/require-permission';
import { logAction } from '@/features/audit/actions/log-action';
import { revalidatePath } from 'next/cache';
import { activityFormSchema, type ActivityFormValues } from '../types';
import { ok, err, type ActionResult } from '@/lib/action-result';

export async function createActivity(values: ActivityFormValues): Promise<ActionResult<{ id: string }>> {
  let userId: string;
  try {
    ({ userId } = await requirePermission('activities.write'));
  } catch {
    return err('Onvoldoende rechten');
  }

  const parsed = activityFormSchema.safeParse(values);
  if (!parsed.success) {
    return err(z.flattenError(parsed.error).fieldErrors);
  }

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('activities')
    .insert({ ...parsed.data, owner_id: userId })
    .select('id')
    .single();

  if (error) {
    return err(error.message);
  }

  await logAction({
    action: 'activity.created',
    entityType: 'activity',
    entityId: data.id,
    metadata: { subject: parsed.data.subject, type: parsed.data.type },
  });

  revalidatePath('/admin/activities');
  return ok(data);
}
