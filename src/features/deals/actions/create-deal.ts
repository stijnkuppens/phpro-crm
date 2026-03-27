'use server';

import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/require-permission';
import { logAction } from '@/features/audit/actions/log-action';
import { revalidatePath } from 'next/cache';
import { dealFormSchema, type DealFormValues } from '../types';
import { ok, err, type ActionResult } from '@/lib/action-result';

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
    return err(error.message);
  }

  await logAction({
    action: 'deal.created',
    entityType: 'deal',
    entityId: data.id,
    metadata: { title: parsed.data.title },
  });

  revalidatePath('/admin/deals');
  return ok(data);
}
