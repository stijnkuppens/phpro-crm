import { cache } from 'react';
import { createServerClient } from '@/lib/supabase/server';
import type { FilterOption } from '@/components/admin/data-table-filters';

export const getTaskFilterOptions = cache(
  async (): Promise<Record<string, FilterOption[]>> => {
    const supabase = await createServerClient();

    const [{ data: accounts }, { data: users }] = await Promise.all([
      supabase.from('accounts').select('id, name').order('name'),
      supabase.from('user_profiles').select('id, full_name').order('full_name'),
    ]);

    return {
      account_id: (accounts ?? []).map((a) => ({ value: a.id, label: a.name })),
      assigned_to: (users ?? []).map((u) => ({
        value: u.id,
        label: u.full_name ?? '',
      })),
    };
  },
);
