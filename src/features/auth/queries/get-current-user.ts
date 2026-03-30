import { cache } from 'react';
import { logger } from '@/lib/logger';
import { createServerClient } from '@/lib/supabase/server';

// One server client per request — shared by all cached queries below.
const getServerClient = cache(() => createServerClient());

// Deduplicated per request — safe to call from layout + page + components
export const getUser = cache(async () => {
  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

export const getUserProfile = cache(async () => {
  const user = await getUser();
  if (!user) return null;
  const supabase = await getServerClient();
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single();
  if (error) logger.error({ err: error, entity: 'user_profiles' }, 'Failed to fetch user profile');
  return data;
});
