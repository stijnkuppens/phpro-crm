'use server';

import { createServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/require-permission';
import { logAction } from '@/features/audit/actions/log-action';
import { revalidatePath } from 'next/cache';

export async function deleteContact(id: string) {
  await requirePermission('contacts.delete');

  const supabase = await createServerClient();
  const { error } = await supabase
    .from('contacts')
    .delete()
    .eq('id', id);

  if (error) {
    return { error: error.message };
  }

  await logAction({
    action: 'contact.deleted',
    entityType: 'contact',
    entityId: id,
  });

  revalidatePath('/admin/contacts');
  return { success: true };
}
