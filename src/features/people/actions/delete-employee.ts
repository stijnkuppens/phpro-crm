'use server';

import { createServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/require-permission';
import { logAction } from '@/features/audit/actions/log-action';
import { revalidatePath } from 'next/cache';
import { ok, err, type ActionResult } from '@/lib/action-result';

export async function deleteEmployee(id: string): Promise<ActionResult> {
  await requirePermission('hr.write');
  const supabase = await createServerClient();
  const { error } = await supabase.from('employees').delete().eq('id', id);
  if (error) return err(error.message);
  await logAction({ action: 'employee.deleted', entityType: 'employee', entityId: id });
  revalidatePath('/admin/people');
  return ok();
}
