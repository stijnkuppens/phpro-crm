'use server';

import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/require-permission';
import { logAction } from '@/features/audit/actions/log-action';
import { revalidatePath } from 'next/cache';
import { accountFormSchema, type AccountFormValues } from '../types';
import { ok, err, type ActionResult } from '@/lib/action-result';

export async function createAccount(values: AccountFormValues): Promise<ActionResult<{ id: string }>> {
  let userId: string;
  try {
    ({ userId } = await requirePermission('accounts.write'));
  } catch {
    return err('Onvoldoende rechten');
  }

  const parsed = accountFormSchema.safeParse(values);
  if (!parsed.success) {
    return err(z.flattenError(parsed.error).fieldErrors);
  }

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('accounts')
    .insert({ ...parsed.data, owner_id: parsed.data.owner_id ?? userId })
    .select('id')
    .single();

  if (error) {
    console.error('[createAccount]', error);
    return err('Er is een fout opgetreden');
  }

  await logAction({
    action: 'account.created',
    entityType: 'account',
    entityId: data.id,
    metadata: { name: parsed.data.name, body: parsed.data },
  });

  revalidatePath('/admin/accounts');
  return ok(data);
}
