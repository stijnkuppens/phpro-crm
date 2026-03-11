import { createServerClient } from '@/lib/supabase/server';
import { StatCard } from '@/components/admin/stat-card';
import { PageHeader } from '@/components/admin/page-header';
import { Users, Contact, HardDrive, TrendingUp } from 'lucide-react';

export default async function DashboardPage() {
  const supabase = await createServerClient();

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  // Parallel fetches — async-parallel best practice
  const [totalContacts, weekContacts, activeUsers] = await Promise.all([
    supabase.from('contacts').select('*', { count: 'exact', head: true }),
    supabase
      .from('contacts')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', weekAgo.toISOString()),
    supabase.from('user_profiles').select('*', { count: 'exact', head: true }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Contacts"
          value={totalContacts.count ?? 0}
          icon={Contact}
        />
        <StatCard
          title="New This Week"
          value={weekContacts.count ?? 0}
          trend={{
            value: weekContacts.count ?? 0,
            label: 'this week',
            direction: 'up',
          }}
          icon={TrendingUp}
        />
        <StatCard
          title="Team Members"
          value={activeUsers.count ?? 0}
          icon={Users}
        />
        <StatCard
          title="Storage"
          value="—"
          icon={HardDrive}
        />
      </div>
    </div>
  );
}
