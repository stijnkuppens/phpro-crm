'use server';

import { revalidatePath } from 'next/cache';
import { createServerClient } from '@/lib/supabase/server';
import { ok, err, type ActionResult } from '@/lib/action-result';
import { settingsSchema } from '../types';

export async function updateSettings(values: { app_name: string; logo_url: string }): Promise<ActionResult<null>> {
  const parsed = settingsSchema.safeParse(values);
  if (!parsed.success) return err('Ongeldige invoer');

  const supabase = await createServerClient();
  const upserts = [
    { key: 'app_name', value: { value: parsed.data.app_name } },
    { key: 'logo_url', value: { value: parsed.data.logo_url } },
  ];

  const { error } = await supabase.from('app_settings').upsert(upserts);
  if (error) return err(error.message);

  revalidatePath('/admin/settings');
  return ok(null);
}
