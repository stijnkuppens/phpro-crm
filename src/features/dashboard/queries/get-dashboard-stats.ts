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

  const [dealsResult, accountsResult, activitiesResult, tasksResult] = await Promise.all([
    supabase
      .from('deals')
      .select('amount, probability')
      .is('closed_at', null),
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

  const openDealValue = (dealsResult.data ?? []).reduce(
    (sum, d) => sum + (Number(d.amount ?? 0) * (d.probability ?? 0)) / 100,
    0,
  );

  return {
    openDealValue,
    upcomingActivities: activitiesResult.count ?? 0,
    overdueTasks: tasksResult.count ?? 0,
    totalAccounts: accountsResult.count ?? 0,
  };
});
