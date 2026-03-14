'use server';

import { createServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/require-permission';
import { logAction } from '@/features/audit/actions/log-action';
import { revalidatePath } from 'next/cache';
import { accountFormSchema, type AccountFormValues } from '../types';

export async function updateAccount(id: string, values: AccountFormValues) {
  await requirePermission('accounts.write');

  const parsed = accountFormSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createServerClient();
  const { error } = await supabase
    .from('accounts')
    .update(parsed.data)
    .eq('id', id);

  if (error) {
    return { error: error.message };
  }

  await logAction({
    action: 'account.updated',
    entityType: 'account',
    entityId: id,
    metadata: { name: parsed.data.name },
  });

  revalidatePath('/admin/accounts');
  return { success: true };
}
