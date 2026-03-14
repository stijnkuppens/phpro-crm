import { cache } from 'react';
import { createServerClient } from '@/lib/supabase/server';
import type { AccountWithRelations } from '../types';

export const getAccount = cache(
  async (id: string): Promise<AccountWithRelations | null> => {
    const supabase = await createServerClient();

    const { data: account, error } = await supabase
      .from('accounts')
      .select(`
        *,
        owner:user_profiles!owner_id(id, full_name),
        manual_services:account_manual_services(*),
        tech_stacks:account_tech_stacks(*),
        samenwerkingsvormen:account_samenwerkingsvormen(*),
        hosting:account_hosting(*),
        competence_centers:account_competence_centers(*),
        services:account_services(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Failed to fetch account:', error.message);
      return null;
    }

    return account as unknown as AccountWithRelations;
  },
);
