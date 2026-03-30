'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { logAction } from '@/features/audit/actions/log-action';
import { type ActionResult, err, ok } from '@/lib/action-result';
import { logger } from '@/lib/logger';
import { requirePermission } from '@/lib/require-permission';
import { createServerClient } from '@/lib/supabase/server';
import { type PersonalInfoFormValues, personalInfoFormSchema } from '../types';

export async function updatePersonalInfo(
  contactId: string,
  values: PersonalInfoFormValues,
): Promise<ActionResult> {
  try {
    await requirePermission('contacts.write');
  } catch {
    return err('Onvoldoende rechten');
  }

  const parsed = personalInfoFormSchema.safeParse(values);
  if (!parsed.success) {
    return err(z.flattenError(parsed.error).fieldErrors);
  }

  const supabase = await createServerClient();
  const { data: before } = await supabase
    .from('contact_personal_info')
    .select('*')
    .eq('contact_id', contactId)
    .single();

  // Upsert: create if not exists, update if exists
  const { error } = await supabase
    .from('contact_personal_info')
    .upsert({ contact_id: contactId, ...parsed.data }, { onConflict: 'contact_id' });

  if (error) {
    logger.error({ err: error }, '[updatePersonalInfo] database error');
    return err('Er is een fout opgetreden');
  }

  await logAction({
    action: 'contact_personal_info.updated',
    entityType: 'contact',
    entityId: contactId,
    metadata: { before, after: parsed.data },
  });

  const { data: contact } = await supabase
    .from('contacts')
    .select('account_id')
    .eq('id', contactId)
    .single();

  revalidatePath('/admin/contacts');
  if (contact?.account_id) {
    revalidatePath(`/admin/accounts/${contact.account_id}`);
  }

  return ok();
}
