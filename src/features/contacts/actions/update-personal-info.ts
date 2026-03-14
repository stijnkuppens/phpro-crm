'use server';

import { createServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/require-permission';
import { logAction } from '@/features/audit/actions/log-action';
import { personalInfoFormSchema, type PersonalInfoFormValues } from '../types';

export async function updatePersonalInfo(contactId: string, values: PersonalInfoFormValues) {
  await requirePermission('contacts.write');

  const parsed = personalInfoFormSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
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
    return { error: error.message };
  }

  await logAction({
    action: 'contact_personal_info.updated',
    entityType: 'contact',
    entityId: contactId,
  });

  return { success: true };
}
