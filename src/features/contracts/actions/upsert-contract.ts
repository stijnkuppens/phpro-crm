'use server';

import { createServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/require-permission';
import { logAction } from '@/features/audit/actions/log-action';
import { revalidatePath } from 'next/cache';
import { contractFormSchema, type ContractFormValues } from '../types';
import { ok, err, type ActionResult } from '@/lib/action-result';

export async function upsertContract(
  accountId: string,
  values: ContractFormValues,
): Promise<ActionResult<{ id: string }>> {
  await requirePermission('contracts.write');

  const parsed = contractFormSchema.safeParse(values);
  if (!parsed.success) {
    return err(parsed.error.flatten().fieldErrors);
  }

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('contracts')
    .upsert({ ...parsed.data, account_id: accountId }, { onConflict: 'account_id' })
    .select('id')
    .single();

  if (error) {
    return err(error.message);
  }

  await logAction({
    action: 'contract.upserted',
    entityType: 'contract',
    entityId: data.id,
    metadata: { account_id: accountId },
  });

  revalidatePath(`/admin/accounts/${accountId}`);
  return ok(data);
}
