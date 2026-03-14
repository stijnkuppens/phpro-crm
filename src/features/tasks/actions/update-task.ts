'use server';

import { createServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/require-permission';
import { logAction } from '@/features/audit/actions/log-action';
import { revalidatePath } from 'next/cache';
import { taskFormSchema, type TaskFormValues } from '../types';
import { ok, err, type ActionResult } from '@/lib/action-result';

export async function updateTask(id: string, values: TaskFormValues): Promise<ActionResult> {
  await requirePermission('tasks.write');

  const parsed = taskFormSchema.safeParse(values);
  if (!parsed.success) {
    return err(parsed.error.flatten().fieldErrors);
  }

  const supabase = await createServerClient();
  const { error } = await supabase
    .from('tasks')
    .update(parsed.data)
    .eq('id', id);

  if (error) {
    return err(error.message);
  }

  await logAction({
    action: 'task.updated',
    entityType: 'task',
    entityId: id,
  });

  revalidatePath('/admin/tasks');
  return ok();
}
