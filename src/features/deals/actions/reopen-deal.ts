'use server';

import { createServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/require-permission';
import { logAction } from '@/features/audit/actions/log-action';
import { revalidatePath } from 'next/cache';
import { ok, err, type ActionResult } from '@/lib/action-result';
import { z } from 'zod';

export async function reopenDeal(dealId: string): Promise<ActionResult> {
  try {
    await requirePermission('deals.write');
  } catch {
    return err('Onvoldoende rechten');
  }

  const idResult = z.string().min(1).safeParse(dealId);
  if (!idResult.success) return err('Invalid deal ID');

  const supabase = await createServerClient();

  const { data: deal } = await supabase
    .from('deals')
    .select('pipeline_id')
    .eq('id', dealId)
    .single();

  if (!deal) return err('Deal niet gevonden');

  const { data: firstStage } = await supabase
    .from('pipeline_stages')
    .select('id, probability')
    .eq('pipeline_id', deal.pipeline_id)
    .eq('is_closed', false)
    .order('sort_order', { ascending: true })
    .limit(1)
    .single();

  if (!firstStage) return err('Geen open stage gevonden');

  const { error } = await supabase
    .from('deals')
    .update({
      stage_id: firstStage.id,
      closed_at: null,
      closed_type: null,
      closed_reason: null,
      closed_notes: null,
      longterm_date: null,
      probability: firstStage.probability,
    })
    .eq('id', dealId);

  if (error) return err(error.message);

  await logAction({
    action: 'deal.reopened',
    entityType: 'deal',
    entityId: dealId,
  });

  revalidatePath('/admin/deals');
  return ok();
}
