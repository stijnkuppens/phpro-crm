'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { logAction } from '@/features/audit/actions/log-action';
import { type ActionResult, err, ok } from '@/lib/action-result';
import { logger } from '@/lib/logger';
import { requirePermission } from '@/lib/require-permission';
import { createServerClient } from '@/lib/supabase/server';
import { type ContactFormValues, contactFormSchema } from '../types';

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
  const { data, error } = await supabase.from('contacts').insert(parsed.data).select('id').single();

  if (error) {
    logger.error({ err: error }, '[createContact] database error');
    return err('Er is een fout opgetreden');
  }

  // Create empty personal info record
  const { error: personalInfoError } = await supabase.from('contact_personal_info').insert({ contact_id: data.id });

  if (personalInfoError) {
    logger.error({ err: personalInfoError }, '[createContact] personalInfo error');
    return err('Er is een fout opgetreden');
  }

  await logAction({
    action: 'contact.created',
    entityType: 'contact',
    entityId: data.id,
    metadata: { name: `${parsed.data.first_name} ${parsed.data.last_name}`, body: parsed.data },
  });

  revalidatePath('/admin/contacts');
  return ok(data);
}
