'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { logAction } from '@/features/audit/actions/log-action';
import { type DealFormValues, dealFormSchema, entityIdSchema } from '@/features/deals/types';
import { type ActionResult, err, ok } from '@/lib/action-result';
import { logger } from '@/lib/logger';
import { requirePermission } from '@/lib/require-permission';
import { createServerClient } from '@/lib/supabase/server';

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
  const { data: before } = await supabase.from('deals').select('*').eq('id', id).single();
  const { data: updatedDeal, error } = await supabase
    .from('deals')
    .update(parsed.data)
    .eq('id', id)
    .select('account_id')
    .single();

  if (error) {
    logger.error({ err: error }, '[updateDeal] database error');
    return err('Er is een fout opgetreden');
  }

  await logAction({
    action: 'deal.updated',
    entityType: 'deal',
    entityId: id,
    metadata: { before, after: parsed.data },
  });

  revalidatePath('/admin/deals');
  if (updatedDeal?.account_id) {
    revalidatePath(`/admin/accounts/${updatedDeal.account_id}`);
  }
  return ok();
}
