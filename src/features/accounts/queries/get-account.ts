import { cache } from 'react';
import { createServerClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
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
        tech_stacks:account_tech_stacks(id, technology:ref_technologies(id, name)),
        samenwerkingsvormen:account_samenwerkingsvormen(id, collaboration_type:ref_collaboration_types(id, name)),
        hosting:account_hosting(id, provider:ref_hosting_providers(id, name), environment:ref_hosting_environments(id, name), url, notes),
        competence_centers:account_competence_centers(id, cc:ref_competence_centers(id, name), contact_person, email, phone, distribution, cc_services:account_cc_services(service_id)),
        services:account_services(id, service:ref_cc_services(id, name))
      `)
      .eq('id', id)
      .single();

    if (error) {
      logger.error({ err: error, entity: 'accounts' }, 'Failed to fetch account');
      return null;
    }

    return account as unknown as AccountWithRelations;
  },
);
