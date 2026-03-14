import { cache } from 'react';
import { createServerClient } from '@/lib/supabase/server';
import type { DealWithRelations } from '../types';

export const getDeal = cache(
  async (id: string): Promise<DealWithRelations | null> => {
    const supabase = await createServerClient();

    const { data, error } = await supabase
      .from('deals')
      .select(`
        *,
        account:accounts!account_id(id, name),
        contact:contacts!contact_id(id, first_name, last_name),
        owner:user_profiles!owner_id(id, full_name),
        stage:pipeline_stages!stage_id(id, name, color, probability, is_closed, is_won, is_longterm),
        pipeline:pipelines!pipeline_id(id, name, type)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Failed to fetch deal:', error.message);
      return null;
    }

    return data as unknown as DealWithRelations;
  },
);
