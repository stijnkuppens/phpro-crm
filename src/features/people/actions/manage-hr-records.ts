'use server';

import { createServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/require-permission';
import { logAction } from '@/features/audit/actions/log-action';
import { revalidatePath } from 'next/cache';
import { ok, err, type ActionResult } from '@/lib/action-result';

type HrTable = 'salary_history' | 'equipment' | 'hr_documents' | 'leave_balances' | 'evaluations' | 'employee_children';

export async function createHrRecord(
  table: HrTable,
  employeeId: string,
  values: Record<string, unknown>,
): Promise<ActionResult<{ id: string }>> {
  let userId: string;
  try {
    ({ userId } = await requirePermission('hr.write'));
  } catch {
    return err('Onvoldoende rechten');
  }
  const supabase = await createServerClient();
  const insertData: Record<string, unknown> = { employee_id: employeeId, ...values };
  if (table === 'salary_history' || table === 'evaluations') {
    insertData.recorded_by = userId;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const queryTable = supabase.from(table) as any;
  const { data, error } = await queryTable.insert(insertData).select('id').single();
  if (error) return err(error.message);

  if (table === 'salary_history' && values.gross_salary) {
    await supabase.from('employees').update({ gross_salary: values.gross_salary as number }).eq('id', employeeId);
  }

  await logAction({ action: `${table}.created`, entityType: table, entityId: data.id, metadata: { employee_id: employeeId } });
  revalidatePath('/admin/people');
  if (table === 'equipment') revalidatePath('/admin/materials');
  return ok(data);
}

export async function updateHrRecord(
  table: HrTable,
  id: string,
  values: Record<string, unknown>,
): Promise<ActionResult> {
  try {
    await requirePermission('hr.write');
  } catch {
    return err('Onvoldoende rechten');
  }
  const supabase = await createServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from(table) as any).update(values).eq('id', id);
  if (error) return err(error.message);
  await logAction({ action: `${table}.updated`, entityType: table, entityId: id });
  revalidatePath('/admin/people');
  if (table === 'equipment') revalidatePath('/admin/materials');
  return ok();
}

export async function deleteHrRecord(table: HrTable, id: string): Promise<ActionResult> {
  try {
    await requirePermission('hr.write');
  } catch {
    return err('Onvoldoende rechten');
  }
  const supabase = await createServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from(table) as any).delete().eq('id', id);
  if (error) return err(error.message);
  await logAction({ action: `${table}.deleted`, entityType: table, entityId: id });
  revalidatePath('/admin/people');
  if (table === 'equipment') revalidatePath('/admin/materials');
  return ok();
}
