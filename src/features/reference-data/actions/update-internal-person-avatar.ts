'use server';

import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/require-permission';
import { revalidatePath } from 'next/cache';
import { ok, err, type ActionResult } from '@/lib/action-result';
import { entityIdSchema } from '@/features/reference-data/types';

export async function updateInternalPersonAvatar(
  id: string,
  avatarUrl: string,
): Promise<ActionResult> {
  try {
    await requirePermission('reference_data.write');
  } catch {
    return err('Onvoldoende rechten');
  }

  const parsedId = entityIdSchema.safeParse(id);
  if (!parsedId.success) return err('Ongeldig ID');
  const parsedUrl = z.string().min(1).safeParse(avatarUrl);
  if (!parsedUrl.success) return err('Ongeldige URL');

  const supabase = await createServerClient();
  const { error } = await supabase
    .from('ref_internal_people')
    .update({ avatar_url: avatarUrl })
    .eq('id', id);

  if (error) {
    console.error('[updateInternalPersonAvatar]', error);
    return err('Er is een fout opgetreden');
  }

  revalidatePath('/admin/reference-data');
  return ok();
}
