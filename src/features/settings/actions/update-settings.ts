'use server';

import { revalidatePath, updateTag } from 'next/cache';
import { type ActionResult, err, ok } from '@/lib/action-result';
import { logger } from '@/lib/logger';
import { requirePermission } from '@/lib/require-permission';
import { createServerClient } from '@/lib/supabase/server';
import { settingsSchema } from '../types';

export async function updateSettings(values: {
  app_name: string;
  logo_url: string;
}): Promise<ActionResult<null>> {
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
    logger.error({ err: error }, '[updateSettings] database error');
    return err('Er is een fout opgetreden');
  }

  revalidatePath('/admin/settings');
  updateTag('settings');
  return ok(null);
}
