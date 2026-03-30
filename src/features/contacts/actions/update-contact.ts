'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { logAction } from '@/features/audit/actions/log-action';
import { type ContactFormValues, contactFormSchema, entityIdSchema } from '@/features/contacts/types';
import { type ActionResult, err, ok } from '@/lib/action-result';
import { logger } from '@/lib/logger';
import { requirePermission } from '@/lib/require-permission';
import { createServerClient } from '@/lib/supabase/server';

export async function updateContact(id: string, values: ContactFormValues): Promise<ActionResult> {
  try {
    await requirePermission('contacts.write');
  } catch {
    return err('Onvoldoende rechten');
  }

  const parsedId = entityIdSchema.safeParse(id);
  if (!parsedId.success) return err('Ongeldig ID');

  const parsed = contactFormSchema.safeParse(values);
  if (!parsed.success) {
    return err(z.flattenError(parsed.error).fieldErrors);
  }

  const supabase = await createServerClient();
  const { data: before } = await supabase.from('contacts').select('*').eq('id', id).single();
  const { error } = await supabase.from('contacts').update(parsed.data).eq('id', id);

  if (error) {
    logger.error({ err: error }, '[updateContact] database error');
    return err('Er is een fout opgetreden');
  }

  await logAction({
    action: 'contact.updated',
    entityType: 'contact',
    entityId: id,
    metadata: { name: `${parsed.data.first_name} ${parsed.data.last_name}`, before, after: parsed.data },
  });

  revalidatePath('/admin/contacts');
  return ok();
}
