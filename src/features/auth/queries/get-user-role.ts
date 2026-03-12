import { cache } from 'react';
import { createServerClient } from '@/lib/supabase/server';
import { getUser } from './get-current-user';

// One server client per request — shared by all cached queries below.
const getServerClient = cache(() => createServerClient());

export const getUserRole = cache(async () => {
  const user = await getUser();
  if (!user) return null;
  const supabase = await getServerClient();
  const { data, error } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  if (error) console.error('Failed to fetch user role:', error.message);
  return data?.role ?? null;
});
