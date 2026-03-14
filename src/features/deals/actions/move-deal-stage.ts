'use server';

import { createServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/require-permission';
import { logAction } from '@/features/audit/actions/log-action';
import { revalidatePath } from 'next/cache';
import { ok, err, type ActionResult } from '@/lib/action-result';

export async function moveDealStage(dealId: string, newStageId: string): Promise<ActionResult> {
  await requirePermission('deals.write');

  const supabase = await createServerClient();

  const { data: stage } = await supabase
    .from('pipeline_stages')
    .select('probability, is_closed')
    .eq('id', newStageId)
    .single();

  if (!stage) {
    return err('Stage not found');
  }

  if (stage.is_closed) {
    return err('Use the close deal flow for closed stages');
  }

  const { error } = await supabase
    .from('deals')
    .update({
      stage_id: newStageId,
      probability: stage.probability,
    })
    .eq('id', dealId);

  if (error) {
    return err(error.message);
  }

  await logAction({
    action: 'deal.stage_moved',
    entityType: 'deal',
    entityId: dealId,
    metadata: { new_stage_id: newStageId },
  });

  revalidatePath('/admin/deals');
  return ok();
}
