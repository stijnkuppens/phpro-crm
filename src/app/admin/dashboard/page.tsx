import { PageHeader } from '@/components/admin/page-header';
import { getDashboardStats } from '@/features/dashboard/queries/get-dashboard-stats';
import { DashboardClient } from '@/features/dashboard/components/dashboard-client';
import { createServerClient } from '@/lib/supabase/server';

export default async function DashboardPage() {
  const supabase = await createServerClient();

  const [stats, { data: recentActivities }, { data: upcomingTasks }] = await Promise.all([
    getDashboardStats(),
    supabase
      .from('activities')
      .select('id, type, subject, date')
      .order('date', { ascending: false })
      .limit(10),
    supabase
      .from('tasks')
      .select('id, title, priority, due_date')
      .neq('status', 'Done')
      .order('due_date', { ascending: true, nullsFirst: false })
      .limit(10),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Dashboard' },
        ]}
      />
      <DashboardClient
        stats={stats}
        recentActivities={recentActivities ?? []}
        upcomingTasks={upcomingTasks ?? []}
      />
    </div>
  );
}
