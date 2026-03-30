'use server';

import { revalidatePath } from 'next/cache';
import { logAction } from '@/features/audit/actions/log-action';
import { entityIdSchema } from '@/features/deals/types';
import { type ActionResult, err, ok } from '@/lib/action-result';
import { logger } from '@/lib/logger';
import { requirePermission } from '@/lib/require-permission';
import { createServerClient } from '@/lib/supabase/server';

export async function deleteDeal(id: string): Promise<ActionResult> {
  try {
    await requirePermission('deals.delete');
  } catch {
    return err('Onvoldoende rechten');
  }

  const parsedId = entityIdSchema.safeParse(id);
  if (!parsedId.success) return err('Ongeldig ID');

  const supabase = await createServerClient();
  const { data: snapshot } = await supabase.from('deals').select('*').eq('id', id).single();
  const { error } = await supabase.from('deals').delete().eq('id', id);

  if (error) {
    logger.error({ err: error }, '[deleteDeal] database error');
    return err('Er is een fout opgetreden');
  }

  await logAction({
    action: 'deal.deleted',
    entityType: 'deal',
    entityId: id,
    metadata: { snapshot },
  });

  revalidatePath('/admin/deals');
  return ok();
}
