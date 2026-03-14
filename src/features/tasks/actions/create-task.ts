'use server';

import { createServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/require-permission';
import { logAction } from '@/features/audit/actions/log-action';
import { revalidatePath } from 'next/cache';
import { taskFormSchema, type TaskFormValues } from '../types';
import { ok, err, type ActionResult } from '@/lib/action-result';

export async function createTask(values: TaskFormValues): Promise<ActionResult<{ id: string }>> {
  const { userId } = await requirePermission('tasks.write');

  const parsed = taskFormSchema.safeParse(values);
  if (!parsed.success) {
    return err(parsed.error.flatten().fieldErrors);
  }

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('tasks')
    .insert({ ...parsed.data, assigned_to: parsed.data.assigned_to ?? userId })
    .select('id')
    .single();

  if (error) {
    return err(error.message);
  }

  await logAction({
    action: 'task.created',
    entityType: 'task',
    entityId: data.id,
    metadata: { title: parsed.data.title },
  });

  revalidatePath('/admin/tasks');
  return ok(data);
}
