'use server';

import { createServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/require-permission';
import { logAction } from '@/features/audit/actions/log-action';
import { revalidatePath } from 'next/cache';
import { communicationFormSchema, type CommunicationFormValues } from '../types';
import { ok, err, type ActionResult } from '@/lib/action-result';

export async function updateCommunication(id: string, values: CommunicationFormValues): Promise<ActionResult> {
  await requirePermission('communications.write');

  const parsed = communicationFormSchema.safeParse(values);
  if (!parsed.success) {
    return err(parsed.error.flatten().fieldErrors);
  }

  const supabase = await createServerClient();
  const { error } = await supabase
    .from('communications')
    .update(parsed.data)
    .eq('id', id);

  if (error) {
    return err(error.message);
  }

  await logAction({
    action: 'communication.updated',
    entityType: 'communication',
    entityId: id,
  });

  revalidatePath('/admin/accounts');
  return ok();
}
