'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { logAction } from '@/features/audit/actions/log-action';
import { type ActionResult, err, ok } from '@/lib/action-result';
import { logger } from '@/lib/logger';
import { requirePermission } from '@/lib/require-permission';
import { createServerClient } from '@/lib/supabase/server';
import { type DealFormValues, dealFormSchema } from '../types';

export async function createDeal(values: DealFormValues): Promise<ActionResult<{ id: string }>> {
  let userId: string;
  try {
    ({ userId } = await requirePermission('deals.write'));
  } catch {
    return err('Onvoldoende rechten');
  }

  const parsed = dealFormSchema.safeParse(values);
  if (!parsed.success) {
    return err(z.flattenError(parsed.error).fieldErrors);
  }

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('deals')
    .insert({ ...parsed.data, owner_id: parsed.data.owner_id ?? userId })
    .select('id')
    .single();

  if (error) {
    logger.error({ err: error }, '[createDeal] database error');
    return err('Er is een fout opgetreden');
  }

  await logAction({
    action: 'deal.created',
    entityType: 'deal',
    entityId: data.id,
    metadata: { title: parsed.data.title, body: parsed.data },
  });

  revalidatePath('/admin/deals');
  return ok(data);
}
