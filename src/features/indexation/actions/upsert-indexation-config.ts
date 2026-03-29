'use server';

import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/require-permission';
import { logAction } from '@/features/audit/actions/log-action';
import { revalidatePath } from 'next/cache';
import { indexationConfigFormSchema, type IndexationConfigFormValues } from '../types';
import { ok, err, type ActionResult } from '@/lib/action-result';

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
  const { data: before } = await supabase.from('indexation_config').select('*').eq('account_id', parsed.data.account_id).single();
  const { error } = await supabase
    .from('indexation_config')
    .upsert(parsed.data, { onConflict: 'account_id' });

  if (error) {
    console.error('[upsertIndexationConfig]', error);
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
