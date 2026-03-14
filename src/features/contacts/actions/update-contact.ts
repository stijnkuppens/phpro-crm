'use server';

import { createServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/require-permission';
import { logAction } from '@/features/audit/actions/log-action';
import { revalidatePath } from 'next/cache';
import { contactFormSchema, type ContactFormValues } from '../types';

export async function updateContact(id: string, values: ContactFormValues) {
  await requirePermission('contacts.write');

  const parsed = contactFormSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createServerClient();
  const { error } = await supabase
    .from('contacts')
    .update(parsed.data)
    .eq('id', id);

  if (error) {
    return { error: error.message };
  }

  await logAction({
    action: 'contact.updated',
    entityType: 'contact',
    entityId: id,
    metadata: { name: `${parsed.data.first_name} ${parsed.data.last_name}` },
  });

  revalidatePath('/admin/contacts');
  return { success: true };
}
