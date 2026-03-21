import { cache } from 'react';
import { createServerClient } from '@/lib/supabase/server';

export type AccountOption = {
  id: string;
  name: string;
  domain: string | null;
  type: string | null;
};

export const getAccountNames = cache(async (): Promise<AccountOption[]> => {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('accounts')
    .select('id, name, domain, type')
    .order('name', { ascending: true });

  if (error) {
    console.error('Failed to fetch account names:', error.message);
    return [];
  }
  return data ?? [];
});
