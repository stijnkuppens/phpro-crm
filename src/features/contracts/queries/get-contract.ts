import { cache } from 'react';
import { logger } from '@/lib/logger';
import { createServerClient } from '@/lib/supabase/server';
import type { Contract } from '../types';

export const getContract = cache(async (accountId: string): Promise<Contract | null> => {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from('contracts')
    .select('*')
    .eq('account_id', accountId)
    .maybeSingle();

  if (error) {
    logger.error({ err: error, entity: 'contracts' }, 'Failed to fetch contract');
    return null;
  }

  return data;
});
