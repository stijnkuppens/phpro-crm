'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { logAction } from '@/features/audit/actions/log-action';
import { type ActionResult, err, ok } from '@/lib/action-result';
import { logger } from '@/lib/logger';
import { requirePermission } from '@/lib/require-permission';
import { createServerClient } from '@/lib/supabase/server';

export async function approveIndexation(
  accountId: string,
  draftId: string,
): Promise<ActionResult<void>> {
  let userId: string;
  try {
    ({ userId } = await requirePermission('indexation.approve'));
  } catch {
    return err('Onvoldoende rechten');
  }
  if (!z.string().min(1).safeParse(accountId).success) return err('Ongeldig account ID');
  if (!z.string().min(1).safeParse(draftId).success) return err('Ongeldig draft ID');

  const supabase = await createServerClient();
  const { data: before } = await supabase
    .from('indexation_drafts')
    .select('*, indexation_draft_rates(*), indexation_draft_sla(*), indexation_draft_sla_tools(*)')
    .eq('id', draftId)
    .single();

  const { error: rpcError } = await supabase.rpc('approve_indexation', {
    p_draft_id: draftId,
    p_approved_by: userId,
  });

  if (rpcError) {
    logger.error({ err: rpcError }, '[approveIndexation] database error');
    return err('Er is een fout opgetreden');
  }

  await logAction({
    action: 'indexation.approved',
    entityType: 'account',
    entityId: accountId,
    metadata: { draft_id: draftId, approved_by: userId, before },
  });

  revalidatePath(`/admin/accounts/${accountId}`);
  return ok();
}
