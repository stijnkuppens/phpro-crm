'use server';

import { requirePermission } from '@/lib/require-permission';
import { createServerClient } from '@/lib/supabase/server';
import { logAction } from '@/features/audit/actions/log-action';

export async function deleteContact(id: string) {
  await requirePermission('contacts.delete');
  const supabase = await createServerClient();

  const { error } = await supabase.from('contacts').delete().eq('id', id);

  if (error) throw new Error(error.message);

  await logAction({
    action: 'contact.deleted',
    entityType: 'contact',
    entityId: id,
  });
}
