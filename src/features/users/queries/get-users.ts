import { cache } from 'react';
import { createServerClient } from '@/lib/supabase/server';

export const getUsers = cache(async (limit = 100) => {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return data;
});
