'use server';

import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/require-permission';
import { logAction } from '@/features/audit/actions/log-action';
import { revalidatePath } from 'next/cache';
import { taskFormSchema, entityIdSchema, type TaskFormValues } from '@/features/tasks/types';
import { ok, err, type ActionResult } from '@/lib/action-result';

export async function updateTask(id: string, values: TaskFormValues): Promise<ActionResult> {
  try {
    await requirePermission('tasks.write');
  } catch {
    return err('Onvoldoende rechten');
  }

  const parsedId = entityIdSchema.safeParse(id);
  if (!parsedId.success) return err('Ongeldig ID');

  const parsed = taskFormSchema.safeParse(values);
  if (!parsed.success) {
    return err(z.flattenError(parsed.error).fieldErrors);
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
