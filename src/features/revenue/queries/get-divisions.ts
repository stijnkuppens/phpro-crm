import { cache } from 'react';
import { createServerClient } from '@/lib/supabase/server';
import type { DivisionWithServices } from '../types';

export const getDivisions = cache(
  async (): Promise<DivisionWithServices[]> => {
    const supabase = await createServerClient();
    const { data, error } = await supabase
      .from('divisions')
      .select(`*, services:division_services(*)`)
      .order('sort_order', { ascending: true });
    if (error) { console.error('Failed to fetch divisions:', error.message); return []; }
    return (data as unknown as DivisionWithServices[]) ?? [];
  },
);
