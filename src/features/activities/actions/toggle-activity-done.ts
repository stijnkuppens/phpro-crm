'use server';

import { createServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/require-permission';
import { revalidatePath } from 'next/cache';
import { ok, err, type ActionResult } from '@/lib/action-result';
import { z } from 'zod';

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
    console.error('[toggleActivityDone]', error);
    return err('Er is een fout opgetreden');
  }

  revalidatePath('/admin/activities');
  revalidatePath('/admin/deals');
  return ok();
}
