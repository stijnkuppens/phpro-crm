import { PageHeader } from '@/components/admin/page-header';
import { getDashboardStats } from '@/features/dashboard/queries/get-dashboard-stats';
import { DashboardView } from '@/features/dashboard/components/dashboard-view';
import { createServerClient } from '@/lib/supabase/server';

export default async function DashboardPage() {
  const supabase = await createServerClient();

  const [stats, activitiesResult] = await Promise.all([
    getDashboardStats(),
    supabase
      .from('activities')
      .select('id, type, subject, date')
      .order('date', { ascending: false })
      .limit(5),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" />
      <DashboardView
        stats={stats}
        recentActivities={activitiesResult.data ?? []}
      />
    </div>
  );
}
