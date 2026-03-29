'use server';

import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/require-permission';
import { logAction } from '@/features/audit/actions/log-action';
import { revalidatePath } from 'next/cache';
import { contactFormSchema, entityIdSchema, type ContactFormValues } from '@/features/contacts/types';
import { ok, err, type ActionResult } from '@/lib/action-result';

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
  const { error } = await supabase
    .from('contacts')
    .update(parsed.data)
    .eq('id', id);

  if (error) {
    console.error('[updateContact]', error);
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
