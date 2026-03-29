'use server';

import { createServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/require-permission';
import { logAction } from '@/features/audit/actions/log-action';
import { revalidatePath } from 'next/cache';
import { ok, err, type ActionResult } from '@/lib/action-result';
import { entityIdSchema } from '@/features/deals/types';

export async function deleteDeal(id: string): Promise<ActionResult> {
  try {
    await requirePermission('deals.delete');
  } catch {
    return err('Onvoldoende rechten');
  }

  const parsedId = entityIdSchema.safeParse(id);
  if (!parsedId.success) return err('Ongeldig ID');

  const supabase = await createServerClient();
  const { error } = await supabase
    .from('deals')
    .delete()
    .eq('id', id);

  if (error) {
    return err(error.message);
  }

  await logAction({
    action: 'deal.deleted',
    entityType: 'deal',
    entityId: id,
  });

  revalidatePath('/admin/deals');
  return ok();
}
