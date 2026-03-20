import { cache } from 'react';
import { createServerClient } from '@/lib/supabase/server';

type FilterOptions = {
  owners: { id: string; full_name: string }[];
  countries: string[];
};

export const getAccountFilterOptions = cache(async (): Promise<FilterOptions> => {
  const supabase = await createServerClient();

  const [{ data: owners }, { data: countries }] = await Promise.all([
    supabase.from('user_profiles').select('id, full_name').order('full_name'),
    supabase.from('accounts').select('country').not('country', 'is', null),
  ]);

  const uniqueCountries = [...new Set((countries ?? []).map((r) => r.country as string))].sort();

  return {
    owners: (owners ?? []).map((o) => ({ id: o.id, full_name: o.full_name ?? '' })),
    countries: uniqueCountries,
  };
});
