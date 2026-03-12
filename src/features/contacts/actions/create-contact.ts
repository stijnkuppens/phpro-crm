'use server';

import { requirePermission } from '@/lib/require-permission';
import { createServerClient } from '@/lib/supabase/server';
import { contactSchema } from '../types';
import { logAction } from '@/features/audit/actions/log-action';

export async function createContact(values: unknown) {
  const { userId } = await requirePermission('contacts.write');
  const parsed = contactSchema.parse(values);
  const supabase = await createServerClient();

  const { data, error } = await supabase.from('contacts').insert({
    name: parsed.name,
    email: parsed.email || null,
    phone: parsed.phone || null,
    company: parsed.company || null,
    notes: parsed.notes || null,
    created_by: userId,
  }).select('id').single();

  if (error) throw new Error(error.message);

  await logAction({
    action: 'contact.created',
    entityType: 'contact',
    entityId: data.id,
    metadata: { name: parsed.name },
  });
}
