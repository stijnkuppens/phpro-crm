'use server';

import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/require-permission';
import { logAction } from '@/features/audit/actions/log-action';
import { revalidatePath } from 'next/cache';
import { accountFormSchema, entityIdSchema, type AccountFormValues } from '@/features/accounts/types';
import { ok, err, type ActionResult } from '@/lib/action-result';

export async function updateAccount(id: string, values: AccountFormValues): Promise<ActionResult> {
  try {
    await requirePermission('accounts.write');
  } catch {
    return err('Onvoldoende rechten');
  }

  const parsedId = entityIdSchema.safeParse(id);
  if (!parsedId.success) return err('Ongeldig ID');

  const parsed = accountFormSchema.safeParse(values);
  if (!parsed.success) {
    return err(z.flattenError(parsed.error).fieldErrors);
  }

  const supabase = await createServerClient();
  const { data: before } = await supabase.from('accounts').select('*').eq('id', id).single();
  const { error } = await supabase
    .from('accounts')
    .update(parsed.data)
    .eq('id', id);

  if (error) {
    console.error('[updateAccount]', error);
    return err('Er is een fout opgetreden');
  }

  await logAction({
    action: 'account.updated',
    entityType: 'account',
    entityId: id,
    metadata: { name: parsed.data.name, before, after: parsed.data },
  });

  revalidatePath('/admin/accounts');
  revalidatePath(`/admin/accounts/${id}`);
  return ok();
}
