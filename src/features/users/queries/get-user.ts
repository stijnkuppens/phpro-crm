import { cache } from 'react';
import { createServerClient } from '@/lib/supabase/server';

export const getUser = cache(async (id: string) => {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw new Error(error.message);
  return data;
});
