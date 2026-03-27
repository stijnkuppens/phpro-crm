import { cache } from 'react';
import { createServerClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

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
    .order('name', { ascending: true })
    .limit(500);

  if (error) {
    logger.error({ err: error, entity: 'accounts' }, 'Failed to fetch account names');
    return [];
  }
  return data ?? [];
});
