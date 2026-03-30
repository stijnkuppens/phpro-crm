'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { logAction } from '@/features/audit/actions/log-action';
import { type ActionResult, err, ok } from '@/lib/action-result';
import { logger } from '@/lib/logger';
import { requirePermission } from '@/lib/require-permission';
import { createServerClient } from '@/lib/supabase/server';
import { type IndexationConfigFormValues, indexationConfigFormSchema } from '../types';

export async function upsertIndexationConfig(
  values: IndexationConfigFormValues,
): Promise<ActionResult<void>> {
  try {
    await requirePermission('indexation.write');
  } catch {
    return err('Onvoldoende rechten');
  }

  const parsed = indexationConfigFormSchema.safeParse(values);
  if (!parsed.success) {
    return err(z.flattenError(parsed.error).fieldErrors);
  }

  const supabase = await createServerClient();
  const { data: before } = await supabase
    .from('indexation_config')
    .select('*')
    .eq('account_id', parsed.data.account_id)
    .single();
  const { error } = await supabase
    .from('indexation_config')
    .upsert(parsed.data, { onConflict: 'account_id' });

  if (error) {
    logger.error({ err: error }, '[upsertIndexationConfig] database error');
    return err('Er is een fout opgetreden');
  }

  await logAction({
    action: 'indexation_config.upserted',
    entityType: 'account',
    entityId: parsed.data.account_id,
    metadata: { before, after: parsed.data },
  });

  revalidatePath(`/admin/accounts/${parsed.data.account_id}`);
  return ok();
}
