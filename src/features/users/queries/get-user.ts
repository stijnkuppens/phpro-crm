import { cache } from 'react';
import { logger } from '@/lib/logger';
import { createServerClient } from '@/lib/supabase/server';

export const getUser = cache(async (id: string) => {
  const supabase = await createServerClient();
  const { data, error } = await supabase.from('user_profiles').select('*').eq('id', id).single();

  if (error) {
    logger.error({ err: error, entity: 'users' }, 'Failed to fetch user');
    return null;
  }
  return data;
});
