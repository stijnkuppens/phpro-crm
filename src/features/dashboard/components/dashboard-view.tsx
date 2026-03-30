import { Activity, Building2, Calendar, DollarSign } from 'lucide-react';
import { EmptyState } from '@/components/admin/empty-state';
import { StatCard } from '@/components/admin/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatEUR } from '@/lib/format';
import type { DashboardStats } from '../queries/get-dashboard-stats';

type ActivityRow = {
  id: string;
  type: string;
  subject: string;
  date: string;
};

type Props = {
  stats: DashboardStats;
  recentActivities: ActivityRow[];
};

export function DashboardView({ stats, recentActivities }: Props) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Open Deal Waarde"
          value={formatEUR(stats.openDealValue)}
          icon={DollarSign}
        />
        <StatCard title="Accounts" value={String(stats.totalAccounts)} icon={Building2} />
        <StatCard
          title="Activiteiten (7d)"
          value={String(stats.upcomingActivities)}
          icon={Calendar}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Recente Activiteiten</CardTitle>
        </CardHeader>
        <CardContent>
          {recentActivities.length === 0 ? (
            <EmptyState icon={Activity} title="Geen recente activiteiten." />
          ) : (
            <div className="space-y-3">
              {recentActivities.map((a) => (
                <div key={a.id} className="flex items-center gap-3 text-sm">
                  <span className="font-medium w-16">{a.type}</span>
                  <span className="flex-1">{a.subject}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(a.date).toLocaleDateString('nl-BE')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
