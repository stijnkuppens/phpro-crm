'use server';

import { createServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/require-permission';
import { logAction } from '@/features/audit/actions/log-action';
import { revalidatePath } from 'next/cache';
import { ok, err, type ActionResult } from '@/lib/action-result';
import { accountRevenueFormSchema, type AccountRevenueFormValues } from '../types';

export async function createAccountRevenue(accountId: string, values: AccountRevenueFormValues): Promise<ActionResult<{ id: string }>> {
  try {
    await requirePermission('revenue.write');
  } catch {
    return err('Onvoldoende rechten');
  }
  const parsed = accountRevenueFormSchema.safeParse(values);
  if (!parsed.success) return err(parsed.error.flatten().fieldErrors);
  const supabase = await createServerClient();
  const { data, error } = await supabase.from('account_revenue').insert({ account_id: accountId, ...parsed.data }).select('id').single();
  if (error) return err(error.message);
  await logAction({ action: 'account_revenue.created', entityType: 'account_revenue', entityId: data.id, metadata: { account_id: accountId, category: parsed.data.category, year: parsed.data.year } });
  revalidatePath('/admin/accounts');
  return ok(data);
}

export async function updateAccountRevenue(id: string, values: AccountRevenueFormValues): Promise<ActionResult> {
  try {
    await requirePermission('revenue.write');
  } catch {
    return err('Onvoldoende rechten');
  }
  const parsed = accountRevenueFormSchema.safeParse(values);
  if (!parsed.success) return err(parsed.error.flatten().fieldErrors);
  const supabase = await createServerClient();
  const { error } = await supabase.from('account_revenue').update(parsed.data).eq('id', id);
  if (error) return err(error.message);
  await logAction({ action: 'account_revenue.updated', entityType: 'account_revenue', entityId: id });
  revalidatePath('/admin/accounts');
  return ok();
}

export async function deleteAccountRevenue(id: string): Promise<ActionResult> {
  try {
    await requirePermission('revenue.write');
  } catch {
    return err('Onvoldoende rechten');
  }
  const supabase = await createServerClient();
  const { error } = await supabase.from('account_revenue').delete().eq('id', id);
  if (error) return err(error.message);
  await logAction({ action: 'account_revenue.deleted', entityType: 'account_revenue', entityId: id });
  revalidatePath('/admin/accounts');
  return ok();
}
