'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { type ActionResult, err, ok } from '@/lib/action-result';
import { logger } from '@/lib/logger';
import { requirePermission } from '@/lib/require-permission';
import { createServerClient } from '@/lib/supabase/server';

const paramsSchema = z.object({
  id: z.string().min(1),
  path: z.string().min(1),
});

export async function updateContactAvatar(id: string, path: string): Promise<ActionResult> {
  try {
    await requirePermission('contacts.write');
  } catch {
    return err('Onvoldoende rechten');
  }

  const parsed = paramsSchema.safeParse({ id, path });
  if (!parsed.success) return err('Ongeldige invoer');

  const supabase = await createServerClient();
  const { error } = await supabase.from('contacts').update({ avatar_url: parsed.data.path }).eq('id', parsed.data.id);

  if (error) {
    logger.error({ err: error }, '[updateContactAvatar] database error');
    return err('Er is een fout opgetreden');
  }

  revalidatePath('/admin/contacts');
  return ok(undefined);
}
