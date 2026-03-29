'use server';

import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/require-permission';
import { logAction } from '@/features/audit/actions/log-action';
import { revalidatePath } from 'next/cache';
import { personalInfoFormSchema, type PersonalInfoFormValues } from '../types';
import { ok, err, type ActionResult } from '@/lib/action-result';

export async function updatePersonalInfo(contactId: string, values: PersonalInfoFormValues): Promise<ActionResult> {
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
  const { data: before } = await supabase.from('contact_personal_info').select('*').eq('contact_id', contactId).single();

  // Upsert: create if not exists, update if exists
  const { error } = await supabase
    .from('contact_personal_info')
    .upsert(
      { contact_id: contactId, ...parsed.data },
      { onConflict: 'contact_id' },
    );

  if (error) {
    console.error('[updatePersonalInfo]', error);
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
