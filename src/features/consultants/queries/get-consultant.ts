import { cache } from 'react';
import { logger } from '@/lib/logger';
import { createServerClient } from '@/lib/supabase/server';
import { CONSULTANT_SELECT, type ConsultantWithDetails } from '../types';

export const getConsultant = cache(async (id: string): Promise<ConsultantWithDetails | null> => {
  const supabase = await createServerClient();
  const { data, error } = await supabase.from('consultants').select(CONSULTANT_SELECT).eq('id', id).single();

  if (error) {
    logger.error({ err: error, entity: 'consultants' }, 'Failed to fetch consultant');
    return null;
  }

  return data as unknown as ConsultantWithDetails;
});
