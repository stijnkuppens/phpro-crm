'use server';

import { createServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/require-permission';
import { ok, err, type ActionResult } from '@/lib/action-result';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

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
  const { error } = await supabase
    .from('contacts')
    .update({ avatar_url: parsed.data.path })
    .eq('id', parsed.data.id);

  if (error) return err(error.message);

  revalidatePath('/admin/contacts');
  return ok(undefined);
}
