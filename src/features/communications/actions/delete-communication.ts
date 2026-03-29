'use server';

import { createServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/require-permission';
import { logAction } from '@/features/audit/actions/log-action';
import { revalidatePath } from 'next/cache';

import { ok, err, type ActionResult } from '@/lib/action-result';
import { entityIdSchema } from '@/features/communications/types';

export async function deleteCommunication(id: string): Promise<ActionResult> {
  try {
    await requirePermission('communications.write');
  } catch {
    return err('Onvoldoende rechten');
  }

  const parsedId = entityIdSchema.safeParse(id);
  if (!parsedId.success) return err('Ongeldig ID');

  const supabase = await createServerClient();
  const { data: snapshot } = await supabase.from('communications').select('*').eq('id', id).single();
  const { error } = await supabase
    .from('communications')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('[deleteCommunication]', error);
    return err('Er is een fout opgetreden');
  }

  await logAction({
    action: 'communication.deleted',
    entityType: 'communication',
    entityId: id,
    metadata: { snapshot },
  });

  revalidatePath('/admin/accounts');
  return ok();
}
