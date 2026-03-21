'use server';

import { createServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/require-permission';
import { logAction } from '@/features/audit/actions/log-action';
import { revalidatePath } from 'next/cache';

import { ok, err, type ActionResult } from '@/lib/action-result';

export async function deleteAccount(id: string): Promise<ActionResult> {
  try {
    await requirePermission('accounts.delete');
  } catch {
    return err('Onvoldoende rechten');
  }

  const supabase = await createServerClient();
  const { error } = await supabase
    .from('accounts')
    .delete()
    .eq('id', id);

  if (error) {
    return err(error.message);
  }

  await logAction({
    action: 'account.deleted',
    entityType: 'account',
    entityId: id,
  });

  revalidatePath('/admin/accounts');
  return ok();
}
