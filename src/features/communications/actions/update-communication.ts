'use server';

import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/require-permission';
import { logAction } from '@/features/audit/actions/log-action';
import { revalidatePath } from 'next/cache';
import { communicationFormSchema, entityIdSchema, type CommunicationFormValues } from '@/features/communications/types';
import { ok, err, type ActionResult } from '@/lib/action-result';
import type { Json } from '@/types/database';

export async function updateCommunication(id: string, values: CommunicationFormValues): Promise<ActionResult> {
  try {
    await requirePermission('communications.write');
  } catch {
    return err('Onvoldoende rechten');
  }

  const parsedId = entityIdSchema.safeParse(id);
  if (!parsedId.success) return err('Ongeldig ID');

  const parsed = communicationFormSchema.safeParse(values);
  if (!parsed.success) {
    return err(z.flattenError(parsed.error).fieldErrors);
  }

  const supabase = await createServerClient();
  const { data: before } = await supabase.from('communications').select('*').eq('id', id).single();
  const { error } = await supabase
    .from('communications')
    .update({ ...parsed.data, content: parsed.data.content as Json })
    .eq('id', id);

  if (error) {
    console.error('[updateCommunication]', error);
    return err('Er is een fout opgetreden');
  }

  await logAction({
    action: 'communication.updated',
    entityType: 'communication',
    entityId: id,
    metadata: { before, after: parsed.data as unknown as Record<string, Json> },
  });

  revalidatePath('/admin/accounts');
  return ok();
}
