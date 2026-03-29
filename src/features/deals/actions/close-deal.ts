'use server';

import { createServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/require-permission';
import { logAction } from '@/features/audit/actions/log-action';
import { revalidatePath } from 'next/cache';
import { closeDealSchema, type CloseDealValues } from '../types';
import { ok, err, type ActionResult } from '@/lib/action-result';
import { z } from 'zod';

export async function closeDeal(dealId: string, values: CloseDealValues): Promise<ActionResult> {
  try {
    await requirePermission('deals.write');
  } catch {
    return err('Onvoldoende rechten');
  }

  const idResult = z.string().min(1).safeParse(dealId);
  if (!idResult.success) {
    return err('Invalid deal ID');
  }

  const parsed = closeDealSchema.safeParse(values);
  if (!parsed.success) {
    return err(z.flattenError(parsed.error).fieldErrors);
  }

  const supabase = await createServerClient();

  const { data: deal } = await supabase
    .from('deals')
    .select('*')
    .eq('id', dealId)
    .single();

  if (!deal) {
    return err('Deal not found');
  }

  let stageQuery = supabase
    .from('pipeline_stages')
    .select('id, probability')
    .eq('pipeline_id', deal.pipeline_id)
    .eq('is_closed', true);

  if (parsed.data.closed_type === 'won') {
    stageQuery = stageQuery.eq('is_won', true);
  } else if (parsed.data.closed_type === 'longterm') {
    stageQuery = stageQuery.eq('is_longterm', true);
  } else {
    stageQuery = stageQuery.eq('is_won', false).eq('is_longterm', false);
  }

  const { data: stage } = await stageQuery.single();

  if (!stage) {
    return err('Could not find appropriate closed stage');
  }

  const { error } = await supabase
    .from('deals')
    .update({
      stage_id: stage.id,
      closed_at: new Date().toISOString(),
      closed_type: parsed.data.closed_type,
      closed_reason: parsed.data.closed_reason,
      closed_notes: parsed.data.closed_notes,
      longterm_date: parsed.data.longterm_date,
      probability: parsed.data.closed_type === 'won' ? 100 : parsed.data.closed_type === 'longterm' ? stage.probability : 0,
    })
    .eq('id', dealId);

  if (error) {
    console.error('[closeDeal]', error);
    return err('Er is een fout opgetreden');
  }

  await logAction({
    action: `deal.closed.${parsed.data.closed_type}`,
    entityType: 'deal',
    entityId: dealId,
    metadata: { closed_type: parsed.data.closed_type, reason: parsed.data.closed_reason ?? null, before: deal },
  });

  revalidatePath('/admin/deals');
  return ok();
}
