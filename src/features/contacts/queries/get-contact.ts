import { cache } from 'react';
import { createServerClient } from '@/lib/supabase/server';
import type { Contact } from '../types';

export const getContact = cache(async (id: string): Promise<Contact | null> => {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return null;

  return data as Contact;
});
