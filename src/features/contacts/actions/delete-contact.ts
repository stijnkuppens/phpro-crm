'use server';

import { createServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/require-permission';
import { logAction } from '@/features/audit/actions/log-action';
import { revalidatePath } from 'next/cache';

import { ok, err, type ActionResult } from '@/lib/action-result';
import { entityIdSchema } from '@/features/contacts/types';

export async function deleteContact(id: string): Promise<ActionResult> {
  try {
    await requirePermission('contacts.delete');
  } catch {
    return err('Onvoldoende rechten');
  }

  const parsedId = entityIdSchema.safeParse(id);
  if (!parsedId.success) return err('Ongeldig ID');

  const supabase = await createServerClient();
  const { error } = await supabase
    .from('contacts')
    .delete()
    .eq('id', id);

  if (error) {
    return err(error.message);
  }

  await logAction({
    action: 'contact.deleted',
    entityType: 'contact',
    entityId: id,
  });

  revalidatePath('/admin/contacts');
  return ok();
}
