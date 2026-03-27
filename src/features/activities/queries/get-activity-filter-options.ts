import { cache } from 'react';
import { createServerClient } from '@/lib/supabase/server';
import type { FilterOption } from '@/components/admin/data-table-filters';

export const getActivityFilterOptions = cache(
  async (): Promise<Record<string, FilterOption[]>> => {
    const supabase = await createServerClient();

    const { data: accounts } = await supabase
      .from('accounts')
      .select('id, name')
      .order('name');

    return {
      account_id: (accounts ?? []).map((a) => ({ value: a.id, label: a.name })),
    };
  },
);
