'use server';

import { createServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/require-permission';
import { revalidatePath } from 'next/cache';
import { ok, err, type ActionResult } from '@/lib/action-result';
import { z } from 'zod';

export async function toggleTaskDone(id: string): Promise<ActionResult> {
  try {
    await requirePermission('tasks.write');
  } catch {
    return err('Onvoldoende rechten');
  }

  const idResult = z.string().min(1).safeParse(id);
  if (!idResult.success) return err('Invalid task ID');

  const supabase = await createServerClient();

  const { data: task } = await supabase
    .from('tasks')
    .select('status')
    .eq('id', id)
    .single();

  if (!task) return err('Taak niet gevonden');

  const newStatus = task.status === 'Done' ? 'Open' : 'Done';
  const { error } = await supabase
    .from('tasks')
    .update({ status: newStatus })
    .eq('id', id);

  if (error) return err(error.message);

  revalidatePath('/admin/tasks');
  revalidatePath('/admin/deals');
  return ok();
}
