'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { entityIdSchema } from '@/features/reference-data/types';
import { type ActionResult, err, ok } from '@/lib/action-result';
import { logger } from '@/lib/logger';
import { requirePermission } from '@/lib/require-permission';
import { createServerClient } from '@/lib/supabase/server';

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
    logger.error({ err: error }, '[updateInternalPersonAvatar] database error');
    return err('Er is een fout opgetreden');
  }

  revalidatePath('/admin/settings/reference-data');
  return ok();
}
