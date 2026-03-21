'use server';

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
    return err(parsed.error.flatten().fieldErrors);
  }

  const supabase = await createServerClient();
  const { error } = await supabase
    .from('indexation_config')
    .upsert(parsed.data, { onConflict: 'account_id' });

  if (error) {
    return err(error.message);
  }

  await logAction({
    action: 'indexation_config.upserted',
    entityType: 'account',
    entityId: parsed.data.account_id,
  });

  revalidatePath(`/admin/accounts/${parsed.data.account_id}`);
  return ok();
}
