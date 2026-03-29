'use server';

import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/require-permission';
import { logAction } from '@/features/audit/actions/log-action';
import { revalidatePath } from 'next/cache';
import { communicationFormSchema, type CommunicationFormValues } from '../types';
import { ok, err, type ActionResult } from '@/lib/action-result';
import type { Json } from '@/types/database';

export async function createCommunication(values: CommunicationFormValues): Promise<ActionResult<{ id: string }>> {
  let userId: string;
  try {
    ({ userId } = await requirePermission('communications.write'));
  } catch {
    return err('Onvoldoende rechten');
  }

  const parsed = communicationFormSchema.safeParse(values);
  if (!parsed.success) {
    return err(z.flattenError(parsed.error).fieldErrors);
  }

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('communications')
    .insert({ ...parsed.data, content: parsed.data.content as Json, owner_id: userId })
    .select('id')
    .single();

  if (error) {
    console.error('[createCommunication]', error);
    return err('Er is een fout opgetreden');
  }

  await logAction({
    action: 'communication.created',
    entityType: 'communication',
    entityId: data.id,
    metadata: { subject: parsed.data.subject, type: parsed.data.type, body: parsed.data as unknown as Record<string, Json> },
  });

  revalidatePath('/admin/accounts');
  return ok(data);
}
