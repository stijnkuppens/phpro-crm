'use server';

import { createServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/require-permission';
import { logAction } from '@/features/audit/actions/log-action';
import { revalidatePath } from 'next/cache';
import { ok, err, type ActionResult } from '@/lib/action-result';
import { entityIdSchema } from '@/features/tasks/types';

export async function deleteTask(id: string): Promise<ActionResult> {
  try {
    await requirePermission('tasks.delete');
  } catch {
    return err('Onvoldoende rechten');
  }

  const parsedId = entityIdSchema.safeParse(id);
  if (!parsedId.success) return err('Ongeldig ID');

  const supabase = await createServerClient();
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id);

  if (error) {
    return err(error.message);
  }

  await logAction({
    action: 'task.deleted',
    entityType: 'task',
    entityId: id,
  });

  revalidatePath('/admin/tasks');
  return ok();
}
