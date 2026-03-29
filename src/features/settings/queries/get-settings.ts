import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { createServiceRoleClient } from '@/lib/supabase/admin';
import type { SettingsValues } from '../types';

const fetchSettings = async (): Promise<SettingsValues> => {
  const supabase = createServiceRoleClient();
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
};

const getCachedSettings = unstable_cache(fetchSettings, ['settings'], {
  revalidate: 300,
  tags: ['settings'],
});

export const getSettings = cache(getCachedSettings);
