'use server';

import { createServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/require-permission';
import { logAction } from '@/features/audit/actions/log-action';
import { revalidatePath } from 'next/cache';

export async function deleteCommunication(id: string) {
  await requirePermission('communications.write');

  const supabase = await createServerClient();
  const { error } = await supabase
    .from('communications')
    .delete()
    .eq('id', id);

  if (error) {
    return { error: error.message };
  }

  await logAction({
    action: 'communication.deleted',
    entityType: 'communication',
    entityId: id,
  });

  revalidatePath('/admin/accounts');
  return { success: true };
}
