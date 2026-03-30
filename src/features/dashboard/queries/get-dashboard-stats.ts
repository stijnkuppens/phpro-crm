import { cache } from 'react';
import { createServerClient } from '@/lib/supabase/server';

export type DashboardStats = {
  openDealValue: number;
  upcomingActivities: number;
  totalAccounts: number;
};

export const getDashboardStats = cache(async (): Promise<DashboardStats> => {
  const supabase = await createServerClient();

  const [dealValueResult, accountsResult, activitiesResult] = await Promise.all([
    supabase.rpc('get_open_deal_value'),
    supabase.from('accounts').select('*', { count: 'exact', head: true }),
    supabase
      .from('activities')
      .select('*', { count: 'exact', head: true })
      .eq('is_done', false)
      .gte('date', new Date().toISOString())
      .lte('date', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()),
  ]);

  return {
    openDealValue: Number(dealValueResult.data ?? 0),
    upcomingActivities: activitiesResult.count ?? 0,
    totalAccounts: accountsResult.count ?? 0,
  };
});
