'use server';

import { createServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/require-permission';
import { logAction } from '@/features/audit/actions/log-action';
import { revalidatePath } from 'next/cache';
import { accountFormSchema, type AccountFormValues } from '../types';
import { ok, err, type ActionResult } from '@/lib/action-result';

export async function createAccount(values: AccountFormValues): Promise<ActionResult<{ id: string }>> {
  const { userId } = await requirePermission('accounts.write');

  const parsed = accountFormSchema.safeParse(values);
  if (!parsed.success) {
    return err(parsed.error.flatten().fieldErrors);
  }

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('accounts')
    .insert({ ...parsed.data, owner_id: parsed.data.owner_id ?? userId })
    .select('id')
    .single();

  if (error) {
    return err(error.message);
  }

  await logAction({
    action: 'account.created',
    entityType: 'account',
    entityId: data.id,
    metadata: { name: parsed.data.name },
  });

  revalidatePath('/admin/accounts');
  return ok(data);
}
