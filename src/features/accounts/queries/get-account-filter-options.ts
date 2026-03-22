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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- RPC added in migration 00078
    (supabase.rpc as any)('get_distinct_account_countries'),
  ]);

  return {
    owners: (owners ?? []).map((o: { id: string; full_name: string | null }) => ({ id: o.id, full_name: o.full_name ?? '' })),
    countries: (countries ?? []).map((r: { country: string }) => r.country),
  };
});
