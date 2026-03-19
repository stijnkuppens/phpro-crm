'use server';

import { createServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/require-permission';
import { logAction } from '@/features/audit/actions/log-action';
import { revalidatePath } from 'next/cache';
import { ok, err, type ActionResult } from '@/lib/action-result';
import { employeeFormSchema, type EmployeeFormValues } from '../types';

export async function createEmployee(values: EmployeeFormValues): Promise<ActionResult<{ id: string }>> {
  await requirePermission('hr.write');
  const parsed = employeeFormSchema.safeParse(values);
  if (!parsed.success) return err(parsed.error.flatten().fieldErrors);
  const supabase = await createServerClient();
  const { data, error } = await supabase.from('employees').insert(parsed.data).select('id').single();
  if (error) return err(error.message);
  await logAction({ action: 'employee.created', entityType: 'employee', entityId: data.id, metadata: { name: `${parsed.data.first_name} ${parsed.data.last_name}` } });
  revalidatePath('/admin/people');
  return ok(data);
}
