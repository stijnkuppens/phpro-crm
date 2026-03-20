import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { PageHeader } from '@/components/admin/page-header';
import { getDeal } from '@/features/deals/queries/get-deal';
import { getActivities } from '@/features/activities/queries/get-activities';
import { getTasks } from '@/features/tasks/queries/get-tasks';
import { getCommunications } from '@/features/communications/queries/get-communications';
import { DealDetail } from '@/features/deals/components/deal-detail';

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const deal = await getDeal(id);
  return { title: deal?.title ?? 'Deal' };
}

export default async function DealDetailPage({ params }: Props) {
  const { id } = await params;

  const [deal, activitiesResult, tasksResult, communicationsResult] = await Promise.all([
    getDeal(id),
    getActivities({ filters: { deal_id: id }, pageSize: 50 }),
    getTasks({ filters: { deal_id: id }, pageSize: 50 }),
    getCommunications({ filters: { deal_id: id }, pageSize: 50 }),
  ]);

  if (!deal) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={deal.title}
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Deals', href: '/admin/deals' },
          { label: deal.title },
        ]}
      />
      <DealDetail
        deal={deal}
        activities={activitiesResult.data}
        tasks={tasksResult.data}
        communications={communicationsResult.data}
      />
    </div>
  );
}
