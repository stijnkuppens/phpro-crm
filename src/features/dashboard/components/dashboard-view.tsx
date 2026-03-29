import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/admin/stat-card';
import { EmptyState } from '@/components/admin/empty-state';
import { DollarSign, AlertCircle, Calendar, Building2, Activity, CheckSquare } from 'lucide-react';
import type { DashboardStats } from '../queries/get-dashboard-stats';
import { formatEUR } from '@/lib/format';

type ActivityRow = {
  id: string;
  type: string;
  subject: string;
  date: string;
};

type TaskRow = {
  id: string;
  title: string;
  priority: string;
  due_date: string | null;
};

type Props = {
  stats: DashboardStats;
  recentActivities: ActivityRow[];
  upcomingTasks: TaskRow[];
};

export function DashboardView({ stats, recentActivities, upcomingTasks }: Props) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Open Deal Waarde"
          value={formatEUR(stats.openDealValue)}
          icon={DollarSign}
        />
        <StatCard
          title="Accounts"
          value={String(stats.totalAccounts)}
          icon={Building2}
        />
        <StatCard
          title="Activiteiten (7d)"
          value={String(stats.upcomingActivities)}
          icon={Calendar}
        />
        <StatCard
          title="Achterstallige Taken"
          value={String(stats.overdueTasks)}
          icon={AlertCircle}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Aankomende Taken</CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingTasks.length === 0 ? (
              <EmptyState icon={CheckSquare} title="Geen openstaande taken." />
            ) : (
              <div className="space-y-3">
                {upcomingTasks.map((t) => (
                  <div key={t.id} className="flex items-center gap-3 text-sm">
                    <span className={`w-2 h-2 rounded-full ${t.priority === 'High' ? 'bg-red-500' : t.priority === 'Medium' ? 'bg-yellow-500' : 'bg-green-500'}`} />
                    <span className="flex-1">{t.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {t.due_date ? new Date(t.due_date).toLocaleDateString('nl-BE') : ''}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
