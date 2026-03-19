'use server';

import { createServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/require-permission';
import { logAction } from '@/features/audit/actions/log-action';
import { revalidatePath } from 'next/cache';
import { ok, err, type ActionResult } from '@/lib/action-result';
import { employeeFormSchema, type EmployeeFormValues } from '../types';

export async function updateEmployee(id: string, values: EmployeeFormValues): Promise<ActionResult> {
  await requirePermission('hr.write');
  const parsed = employeeFormSchema.safeParse(values);
  if (!parsed.success) return err(parsed.error.flatten().fieldErrors);
  const supabase = await createServerClient();
  const { error } = await supabase.from('employees').update(parsed.data).eq('id', id);
  if (error) return err(error.message);
  await logAction({ action: 'employee.updated', entityType: 'employee', entityId: id });
  revalidatePath('/admin/people');
  return ok();
}
