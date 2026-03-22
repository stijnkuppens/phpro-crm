import { cache } from 'react';
import { createServerClient } from '@/lib/supabase/server';

export type DashboardStats = {
  openDealValue: number;
  upcomingActivities: number;
  overdueTasks: number;
  totalAccounts: number;
};

export const getDashboardStats = cache(async (): Promise<DashboardStats> => {
  const supabase = await createServerClient();

  const [dealValueResult, accountsResult, activitiesResult, tasksResult] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- RPC added in migration 00074, regenerate types with `task types:generate`
    (supabase.rpc as any)('get_open_deal_value') as Promise<{ data: number | null; error: unknown }>,
    supabase
      .from('accounts')
      .select('*', { count: 'exact', head: true }),
    supabase
      .from('activities')
      .select('*', { count: 'exact', head: true })
      .eq('is_done', false)
      .gte('date', new Date().toISOString())
      .lte('date', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()),
    supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .neq('status', 'Done')
      .lt('due_date', new Date().toISOString().split('T')[0]),
  ]);

  return {
    openDealValue: Number(dealValueResult.data ?? 0),
    upcomingActivities: activitiesResult.count ?? 0,
    overdueTasks: tasksResult.count ?? 0,
    totalAccounts: accountsResult.count ?? 0,
  };
});
