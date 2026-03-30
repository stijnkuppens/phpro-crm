'use server';

import { revalidatePath } from 'next/cache';
import { logAction } from '@/features/audit/actions/log-action';
import { entityIdSchema } from '@/features/contacts/types';
import { type ActionResult, err, ok } from '@/lib/action-result';
import { logger } from '@/lib/logger';
import { requirePermission } from '@/lib/require-permission';
import { createServerClient } from '@/lib/supabase/server';

export async function deleteContact(id: string): Promise<ActionResult> {
  try {
    await requirePermission('contacts.delete');
  } catch {
    return err('Onvoldoende rechten');
  }

  const parsedId = entityIdSchema.safeParse(id);
  if (!parsedId.success) return err('Ongeldig ID');

  const supabase = await createServerClient();
  const { data: snapshot } = await supabase.from('contacts').select('*').eq('id', id).single();
  const { error } = await supabase.from('contacts').delete().eq('id', id);

  if (error) {
    logger.error({ err: error }, '[deleteContact] database error');
    return err('Er is een fout opgetreden');
  }

  await logAction({
    action: 'contact.deleted',
    entityType: 'contact',
    entityId: id,
    metadata: { snapshot },
  });

  revalidatePath('/admin/contacts');
  return ok();
}
