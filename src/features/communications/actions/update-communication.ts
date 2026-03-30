'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { logAction } from '@/features/audit/actions/log-action';
import { type CommunicationFormValues, communicationFormSchema, entityIdSchema } from '@/features/communications/types';
import { type ActionResult, err, ok } from '@/lib/action-result';
import { logger } from '@/lib/logger';
import { requirePermission } from '@/lib/require-permission';
import { createServerClient } from '@/lib/supabase/server';
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
    logger.error({ err: error }, '[updateCommunication] database error');
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
