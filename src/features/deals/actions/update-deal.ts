'use server';

import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/require-permission';
import { logAction } from '@/features/audit/actions/log-action';
import { revalidatePath } from 'next/cache';
import { dealFormSchema, entityIdSchema, type DealFormValues } from '@/features/deals/types';
import { ok, err, type ActionResult } from '@/lib/action-result';

export async function updateDeal(id: string, values: DealFormValues): Promise<ActionResult> {
  try {
    await requirePermission('deals.write');
  } catch {
    return err('Onvoldoende rechten');
  }

  const parsedId = entityIdSchema.safeParse(id);
  if (!parsedId.success) return err('Ongeldig ID');

  const parsed = dealFormSchema.safeParse(values);
  if (!parsed.success) {
    return err(z.flattenError(parsed.error).fieldErrors);
  }

  const supabase = await createServerClient();
  const { data: updatedDeal, error } = await supabase
    .from('deals')
    .update(parsed.data)
    .eq('id', id)
    .select('account_id')
    .single();

  if (error) {
    return err(error.message);
  }

  await logAction({
    action: 'deal.updated',
    entityType: 'deal',
    entityId: id,
  });

  revalidatePath('/admin/deals');
  if (updatedDeal?.account_id) {
    revalidatePath(`/admin/accounts/${updatedDeal.account_id}`);
  }
  return ok();
}
