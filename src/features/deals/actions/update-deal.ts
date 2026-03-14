'use server';

import { createServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/require-permission';
import { logAction } from '@/features/audit/actions/log-action';
import { revalidatePath } from 'next/cache';
import { dealFormSchema, type DealFormValues } from '../types';
import { ok, err, type ActionResult } from '@/lib/action-result';

export async function updateDeal(id: string, values: DealFormValues): Promise<ActionResult> {
  await requirePermission('deals.write');

  const parsed = dealFormSchema.safeParse(values);
  if (!parsed.success) {
    return err(parsed.error.flatten().fieldErrors);
  }

  const supabase = await createServerClient();
  const { error } = await supabase
    .from('deals')
    .update(parsed.data)
    .eq('id', id);

  if (error) {
    return err(error.message);
  }

  await logAction({
    action: 'deal.updated',
    entityType: 'deal',
    entityId: id,
  });

  revalidatePath('/admin/deals');
  return ok();
}
