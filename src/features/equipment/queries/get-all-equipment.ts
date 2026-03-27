import { cache } from 'react';
import { createServerClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import type { EquipmentWithEmployee } from '../types';

export const getAllEquipment = cache(
  async (): Promise<EquipmentWithEmployee[]> => {
    const supabase = await createServerClient();
    const { data, error } = await supabase
      .from('equipment')
      .select(`*, employee:employees!employee_id(id, first_name, last_name)`)
      .order('date_issued', { ascending: false })
      .limit(200);
    if (error) { logger.error({ err: error, entity: 'equipment' }, 'Failed to fetch equipment'); return []; }
    return (data as unknown as EquipmentWithEmployee[]) ?? [];
  },
);
