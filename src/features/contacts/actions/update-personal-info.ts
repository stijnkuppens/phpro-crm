'use server';

import { createServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/require-permission';
import { logAction } from '@/features/audit/actions/log-action';
import { revalidatePath } from 'next/cache';
import { personalInfoFormSchema, type PersonalInfoFormValues } from '../types';
import { ok, err, type ActionResult } from '@/lib/action-result';

export async function updatePersonalInfo(contactId: string, values: PersonalInfoFormValues): Promise<ActionResult> {
  await requirePermission('contacts.write');

  const parsed = personalInfoFormSchema.safeParse(values);
  if (!parsed.success) {
    return err(parsed.error.flatten().fieldErrors);
  }

  const supabase = await createServerClient();

  // Upsert: create if not exists, update if exists
  const { error } = await supabase
    .from('contact_personal_info')
    .upsert(
      { contact_id: contactId, ...parsed.data },
      { onConflict: 'contact_id' },
    );

  if (error) {
    return err(error.message);
  }

  await logAction({
    action: 'contact_personal_info.updated',
    entityType: 'contact',
    entityId: contactId,
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
