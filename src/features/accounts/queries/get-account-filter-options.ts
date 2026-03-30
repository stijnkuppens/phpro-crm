import { cache } from 'react';
import type { FilterOption } from '@/components/admin/data-table-filters';
import { createServerClient } from '@/lib/supabase/server';

export const getAccountFilterOptions = cache(async (): Promise<Record<string, FilterOption[]>> => {
  const supabase = await createServerClient();

  const [{ data: owners }] = await Promise.all([
    supabase.from('user_profiles').select('id, full_name').order('full_name'),
  ]);

  return {
    owner_id: (owners ?? []).map((o: { id: string; full_name: string | null }) => ({
      value: o.id,
      label: o.full_name ?? '',
    })),
  };
});
