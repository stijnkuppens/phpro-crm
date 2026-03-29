'use server';

import { z } from 'zod';
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
  try {
    await requirePermission('contracts.write');
  } catch {
    return err('Onvoldoende rechten');
  }

  const parsed = contractFormSchema.safeParse(values);
  if (!parsed.success) {
    return err(z.flattenError(parsed.error).fieldErrors);
  }

  const supabase = await createServerClient();
  const { data: before } = await supabase.from('contracts').select('*').eq('account_id', accountId).single();
  const { data, error } = await supabase
    .from('contracts')
    .upsert({ ...parsed.data, account_id: accountId }, { onConflict: 'account_id' })
    .select('id')
    .single();

  if (error) {
    console.error('[upsertContract]', error);
    return err('Er is een fout opgetreden');
  }

  await logAction({
    action: 'contract.upserted',
    entityType: 'contract',
    entityId: data.id,
    metadata: { account_id: accountId, before, after: parsed.data },
  });

  revalidatePath(`/admin/accounts/${accountId}`);
  return ok(data);
}
