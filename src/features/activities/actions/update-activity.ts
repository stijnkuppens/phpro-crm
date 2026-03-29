'use server';

import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/require-permission';
import { logAction } from '@/features/audit/actions/log-action';
import { revalidatePath } from 'next/cache';
import { activityFormSchema, entityIdSchema, type ActivityFormValues } from '@/features/activities/types';
import { ok, err, type ActionResult } from '@/lib/action-result';
import type { Json } from '@/types/database';

export async function updateActivity(id: string, values: ActivityFormValues): Promise<ActionResult> {
  try {
    await requirePermission('activities.write');
  } catch {
    return err('Onvoldoende rechten');
  }

  const parsedId = entityIdSchema.safeParse(id);
  if (!parsedId.success) return err('Ongeldig ID');

  const parsed = activityFormSchema.safeParse(values);
  if (!parsed.success) {
    return err(z.flattenError(parsed.error).fieldErrors);
  }

  const supabase = await createServerClient();
  const { data: before } = await supabase.from('activities').select('*').eq('id', id).single();
  const { error } = await supabase
    .from('activities')
    .update({ ...parsed.data, notes: parsed.data.notes as Json })
    .eq('id', id);

  if (error) {
    console.error('[updateActivity]', error);
    return err('Er is een fout opgetreden');
  }

  await logAction({
    action: 'activity.updated',
    entityType: 'activity',
    entityId: id,
    metadata: { before, after: parsed.data as unknown as Record<string, Json> },
  });

  revalidatePath('/admin/activities');
  return ok();
}
