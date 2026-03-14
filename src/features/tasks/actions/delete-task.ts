'use server';

import { createServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/require-permission';
import { logAction } from '@/features/audit/actions/log-action';
import { revalidatePath } from 'next/cache';
import { ok, err, type ActionResult } from '@/lib/action-result';

export async function deleteTask(id: string): Promise<ActionResult> {
  await requirePermission('tasks.write');

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
