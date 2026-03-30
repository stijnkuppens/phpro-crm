'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { logAction } from '@/features/audit/actions/log-action';
import { type ActionResult, err, ok } from '@/lib/action-result';
import { logger } from '@/lib/logger';
import { requirePermission } from '@/lib/require-permission';
import { createServerClient } from '@/lib/supabase/server';
import type { Json } from '@/types/database';
import { type CommunicationFormValues, communicationFormSchema } from '../types';

export async function createCommunication(
  values: CommunicationFormValues,
): Promise<ActionResult<{ id: string }>> {
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
    .insert({
      ...parsed.data,
      content: parsed.data.content as Json,
      owner_id: userId,
    })
    .select('id')
    .single();

  if (error) {
    logger.error({ err: error }, '[createCommunication] database error');
    return err('Er is een fout opgetreden');
  }

  await logAction({
    action: 'communication.created',
    entityType: 'communication',
    entityId: data.id,
    metadata: {
      subject: parsed.data.subject,
      type: parsed.data.type,
      body: parsed.data as unknown as Record<string, Json>,
    },
  });

  revalidatePath('/admin/accounts');
  return ok(data);
}
