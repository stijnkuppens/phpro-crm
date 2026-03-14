import { cache } from 'react';
import { createServerClient } from '@/lib/supabase/server';
import type { ContactWithDetails } from '../types';

export const getContact = cache(
  async (id: string): Promise<ContactWithDetails | null> => {
    const supabase = await createServerClient();

    const { data, error } = await supabase
      .from('contacts')
      .select(`
        *,
        personal_info:contact_personal_info(*),
        account:accounts!account_id(id, name)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Failed to fetch contact:', error.message);
      return null;
    }

    return data as unknown as ContactWithDetails;
  },
);
