'use server';

import { createServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/require-permission';
import { logAction } from '@/features/audit/actions/log-action';
import { revalidatePath } from 'next/cache';

export async function deleteAccount(id: string) {
  await requirePermission('accounts.delete');

  const supabase = await createServerClient();
  const { error } = await supabase
    .from('accounts')
    .delete()
    .eq('id', id);

  if (error) {
    return { error: error.message };
  }

  await logAction({
    action: 'account.deleted',
    entityType: 'account',
    entityId: id,
  });

  revalidatePath('/admin/accounts');
  return { success: true };
}
