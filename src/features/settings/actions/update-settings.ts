'use server';

import { revalidatePath, updateTag } from 'next/cache';
import { createServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/require-permission';
import { ok, err, type ActionResult } from '@/lib/action-result';
import { settingsSchema } from '../types';

export async function updateSettings(values: { app_name: string; logo_url: string }): Promise<ActionResult<null>> {
  try {
    await requirePermission('settings.write');
  } catch {
    return err('Onvoldoende rechten');
  }

  const parsed = settingsSchema.safeParse(values);
  if (!parsed.success) return err('Ongeldige invoer');

  const supabase = await createServerClient();
  const upserts = [
    { key: 'app_name', value: { value: parsed.data.app_name } },
    { key: 'logo_url', value: { value: parsed.data.logo_url } },
  ];

  const { error } = await supabase.from('app_settings').upsert(upserts);
  if (error) {
    console.error('[updateSettings]', error);
    return err('Er is een fout opgetreden');
  }

  revalidatePath('/admin/settings');
  updateTag('settings');
  return ok(null);
}
