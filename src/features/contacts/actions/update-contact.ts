'use server';

import { requirePermission } from '@/lib/require-permission';
import { createServerClient } from '@/lib/supabase/server';
import { contactSchema } from '../types';

export async function updateContact(id: string, values: unknown) {
  await requirePermission('contacts.write');
  const parsed = contactSchema.parse(values);
  const supabase = await createServerClient();

  const { error } = await supabase
    .from('contacts')
    .update({
      name: parsed.name,
      email: parsed.email || null,
      phone: parsed.phone || null,
      company: parsed.company || null,
      notes: parsed.notes || null,
    })
    .eq('id', id);

  if (error) throw new Error(error.message);

  // TODO: logAction()
}
