import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { PageHeader } from '@/components/admin/page-header';
import { getDeal } from '@/features/deals/queries/get-deal';
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
  const deal = await getDeal(id);

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
      <DealDetail deal={deal} />
    </div>
  );
}
