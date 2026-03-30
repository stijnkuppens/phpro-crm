'use server';

import { revalidatePath } from 'next/cache';
import { entityIdSchema } from '@/features/accounts/types';
import { logAction } from '@/features/audit/actions/log-action';
import { type ActionResult, err, ok } from '@/lib/action-result';
import { logger } from '@/lib/logger';
import { requirePermission } from '@/lib/require-permission';
import { createServerClient } from '@/lib/supabase/server';

export async function deleteAccount(id: string): Promise<ActionResult> {
  try {
    await requirePermission('accounts.delete');
  } catch {
    return err('Onvoldoende rechten');
  }

  const parsedId = entityIdSchema.safeParse(id);
  if (!parsedId.success) return err('Ongeldig ID');

  const supabase = await createServerClient();
  const { data: snapshot } = await supabase.from('accounts').select('*').eq('id', id).single();
  const { error } = await supabase.from('accounts').delete().eq('id', id);

  if (error) {
    logger.error({ err: error }, '[deleteAccount] database error');
    return err('Er is een fout opgetreden');
  }

  await logAction({
    action: 'account.deleted',
    entityType: 'account',
    entityId: id,
    metadata: { snapshot },
  });

  revalidatePath('/admin/accounts');
  return ok();
}
