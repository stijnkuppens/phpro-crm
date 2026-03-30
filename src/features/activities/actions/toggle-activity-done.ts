'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { type ActionResult, err, ok } from '@/lib/action-result';
import { logger } from '@/lib/logger';
import { requirePermission } from '@/lib/require-permission';
import { createServerClient } from '@/lib/supabase/server';

export async function toggleActivityDone(id: string): Promise<ActionResult> {
  try {
    await requirePermission('activities.write');
  } catch {
    return err('Onvoldoende rechten');
  }

  const idResult = z.string().min(1).safeParse(id);
  if (!idResult.success) return err('Invalid activity ID');

  const supabase = await createServerClient();

  const { data: activity } = await supabase
    .from('activities')
    .select('is_done')
    .eq('id', id)
    .single();

  if (!activity) return err('Activiteit niet gevonden');

  const { error } = await supabase
    .from('activities')
    .update({ is_done: !activity.is_done })
    .eq('id', id);

  if (error) {
    logger.error({ err: error }, '[toggleActivityDone] database error');
    return err('Er is een fout opgetreden');
  }

  revalidatePath('/admin/activities');
  revalidatePath('/admin/deals');
  return ok();
}
