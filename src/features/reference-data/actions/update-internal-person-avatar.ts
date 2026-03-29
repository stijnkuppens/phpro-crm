'use server';

import { createServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/require-permission';
import { revalidatePath } from 'next/cache';
import { ok, err, type ActionResult } from '@/lib/action-result';

export async function updateInternalPersonAvatar(
  id: string,
  avatarUrl: string,
): Promise<ActionResult> {
  try {
    await requirePermission('reference_data.write');
  } catch {
    return err('Onvoldoende rechten');
  }

  const supabase = await createServerClient();
  const { error } = await supabase
    .from('ref_internal_people')
    .update({ avatar_url: avatarUrl })
    .eq('id', id);

  if (error) {
    return err(error.message);
  }

  revalidatePath('/admin/reference-data');
  return ok();
}
