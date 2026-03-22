import { cache } from 'react';
import { createServerClient } from '@/lib/supabase/server';
import type { SettingsValues } from '../types';

export const getSettings = cache(async (): Promise<SettingsValues> => {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from('app_settings')
    .select('key, value');

  const settings: SettingsValues = { app_name: '', logo_url: '' };
  if (data) {
    for (const row of data) {
      if (row.key === 'app_name') settings.app_name = (row.value as { value?: string })?.value ?? '';
      if (row.key === 'logo_url') settings.logo_url = (row.value as { value?: string })?.value ?? '';
    }
  }
  return settings;
});
