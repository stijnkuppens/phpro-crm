'use server';

import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/require-permission';
import { logAction } from '@/features/audit/actions/log-action';
import { revalidatePath } from 'next/cache';
import { ok, err, type ActionResult } from '@/lib/action-result';

export async function archiveConsultant(
  id: string,
  archive: boolean = true,
): Promise<ActionResult> {
  try {
    await requirePermission('consultants.write');
  } catch {
    return err('Onvoldoende rechten');
  }
  if (!z.string().min(1).safeParse(id).success) return err('Ongeldig ID');

  const supabase = await createServerClient();
  const { error } = await supabase
    .from('consultants')
    .update({ is_archived: archive })
    .eq('id', id)
    .eq('status', 'bench');

  if (error) {
    return err(error.message);
  }

  await logAction({
    action: archive ? 'consultant.archived' : 'consultant.unarchived',
    entityType: 'consultant',
    entityId: id,
  });

  revalidatePath('/admin/consultants');
  return ok();
}
