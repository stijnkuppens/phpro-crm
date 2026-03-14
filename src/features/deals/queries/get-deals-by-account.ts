import { cache } from 'react';
import { createServerClient } from '@/lib/supabase/server';
import type { DealWithRelations } from '../types';

export const getDealsByAccount = cache(async (accountId: string): Promise<DealWithRelations[]> => {
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
    .eq('account_id', accountId)
    .order('created_at', { ascending: false });
  if (error) {
    console.error('Failed to fetch deals by account:', error.message);
    return [];
  }
  return (data as unknown as DealWithRelations[]) ?? [];
});
