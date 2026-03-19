import { cache } from 'react';
import { createServerClient } from '@/lib/supabase/server';
import type { RevenueClientFull } from '../types';

export const getRevenueClients = cache(
  async (): Promise<RevenueClientFull[]> => {
    const supabase = await createServerClient();
    const { data, error } = await supabase
      .from('revenue_clients')
      .select(`*, divisions:revenue_client_divisions(*, division:divisions(*)), services:revenue_client_services(*)`)
      .order('name', { ascending: true });
    if (error) { console.error('Failed to fetch revenue clients:', error.message); return []; }
    return (data as unknown as RevenueClientFull[]) ?? [];
  },
);
