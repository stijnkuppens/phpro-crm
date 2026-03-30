import { PageHeader } from '@/components/admin/page-header';
import { getRecentActivities } from '@/features/activities/queries/get-recent-activities';
import { DashboardView } from '@/features/dashboard/components/dashboard-view';
import { getDashboardStats } from '@/features/dashboard/queries/get-dashboard-stats';

export default async function DashboardPage() {
  const [stats, recentActivities] = await Promise.all([getDashboardStats(), getRecentActivities()]);

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Dashboard' }]} />
      <DashboardView stats={stats} recentActivities={recentActivities} />
    </div>
  );
}
