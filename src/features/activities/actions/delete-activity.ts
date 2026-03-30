'use server';

import { revalidatePath } from 'next/cache';
import { entityIdSchema } from '@/features/activities/types';
import { logAction } from '@/features/audit/actions/log-action';
import { type ActionResult, err, ok } from '@/lib/action-result';
import { logger } from '@/lib/logger';
import { requirePermission } from '@/lib/require-permission';
import { createServerClient } from '@/lib/supabase/server';

export async function deleteActivity(id: string): Promise<ActionResult> {
  try {
    await requirePermission('activities.delete');
  } catch {
    return err('Onvoldoende rechten');
  }

  const parsedId = entityIdSchema.safeParse(id);
  if (!parsedId.success) return err('Ongeldig ID');

  const supabase = await createServerClient();
  const { data: snapshot } = await supabase.from('activities').select('*').eq('id', id).single();
  const { error } = await supabase.from('activities').delete().eq('id', id);

  if (error) {
    logger.error({ err: error }, '[deleteActivity] database error');
    return err('Er is een fout opgetreden');
  }

  await logAction({
    action: 'activity.deleted',
    entityType: 'activity',
    entityId: id,
    metadata: { snapshot },
  });

  revalidatePath('/admin/activities');
  return ok();
}
