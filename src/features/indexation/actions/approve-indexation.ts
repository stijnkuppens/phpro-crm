'use server';

import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/require-permission';
import { logAction } from '@/features/audit/actions/log-action';
import { revalidatePath } from 'next/cache';
import { ok, err, type ActionResult } from '@/lib/action-result';

export async function approveIndexation(
  accountId: string,
  draftId: string,
): Promise<ActionResult<void>> {
  if (!z.string().min(1).safeParse(accountId).success) return err('Ongeldig account ID');
  if (!z.string().min(1).safeParse(draftId).success) return err('Ongeldig draft ID');
  const { userId } = await requirePermission('indexation.approve');

  const supabase = await createServerClient();

  const { error: rpcError } = await supabase.rpc('approve_indexation', {
    p_draft_id: draftId,
    p_approved_by: userId,
  });

  if (rpcError) {
    return err(rpcError.message);
  }

  await logAction({
    action: 'indexation.approved',
    entityType: 'account',
    entityId: accountId,
    metadata: { draft_id: draftId, approved_by: userId },
  });

  revalidatePath(`/admin/accounts/${accountId}`);
  return ok();
}
