'use server';

import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/require-permission';
import { logAction } from '@/features/audit/actions/log-action';
import { revalidatePath } from 'next/cache';
import { contactFormSchema, type ContactFormValues } from '../types';
import { ok, err, type ActionResult } from '@/lib/action-result';

export async function createContact(values: ContactFormValues): Promise<ActionResult<{ id: string }>> {
  try {
    await requirePermission('contacts.write');
  } catch {
    return err('Onvoldoende rechten');
  }

  const parsed = contactFormSchema.safeParse(values);
  if (!parsed.success) {
    return err(z.flattenError(parsed.error).fieldErrors);
  }

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('contacts')
    .insert(parsed.data)
    .select('id')
    .single();

  if (error) {
    return err(error.message);
  }

  // Create empty personal info record
  const { error: personalInfoError } = await supabase
    .from('contact_personal_info')
    .insert({ contact_id: data.id });

  if (personalInfoError) {
    return err(personalInfoError.message);
  }

  await logAction({
    action: 'contact.created',
    entityType: 'contact',
    entityId: data.id,
    metadata: { name: `${parsed.data.first_name} ${parsed.data.last_name}` },
  });

  revalidatePath('/admin/contacts');
  return ok(data);
}
