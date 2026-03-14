'use server';

import { createServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/require-permission';
import { logAction } from '@/features/audit/actions/log-action';
import { revalidatePath } from 'next/cache';
import { communicationFormSchema, type CommunicationFormValues } from '../types';

export async function createCommunication(values: CommunicationFormValues) {
  const { userId } = await requirePermission('communications.write');

  const parsed = communicationFormSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('communications')
    .insert({ ...parsed.data, owner_id: userId })
    .select('id')
    .single();

  if (error) {
    return { error: error.message };
  }

  await logAction({
    action: 'communication.created',
    entityType: 'communication',
    entityId: data.id,
    metadata: { subject: parsed.data.subject, type: parsed.data.type },
  });

  revalidatePath('/admin/accounts');
  return { data };
}
