import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { PageHeader } from '@/components/admin/page-header';
import { getDeal } from '@/features/deals/queries/get-deal';
import { getPipelines } from '@/features/deals/queries/get-pipelines';
import { getActivities } from '@/features/activities/queries/get-activities';
import { getCommunications } from '@/features/communications/queries/get-communications';
import { DealDetail } from '@/features/deals/components/deal-detail';
import { createServerClient } from '@/lib/supabase/server';

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
  const supabase = await createServerClient();

  const [deal, activitiesResult, communicationsResult, pipelines, { data: ownerRows }] = await Promise.all([
    getDeal(id),
    getActivities({ filters: { deal_id: id }, pageSize: 50 }),
    getCommunications({ filters: { deal_id: id }, pageSize: 50 }),
    getPipelines(),
    supabase.from('user_profiles').select('id, full_name').order('full_name'),
  ]);

  if (!deal) {
    notFound();
  }

  // Fetch consultant after we have the deal (needs deal.consultant_id)
  const consultant = deal.consultant_id
    ? (await supabase.from('consultants').select('id, first_name, last_name, role, city').eq('id', deal.consultant_id).single()).data
    : null;

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
        communications={communicationsResult.data}
        pipelines={pipelines}
        owners={(ownerRows ?? []).map((o) => ({ id: o.id, name: o.full_name ?? '' }))}
        consultant={consultant}
      />
    </div>
  );
}
