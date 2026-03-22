import { PageHeader } from '@/components/admin/page-header';
import { getDeals } from '@/features/deals/queries/get-deals';
import { getPipelines } from '@/features/deals/queries/get-pipelines';
import { DealsPageClient } from '@/features/deals/components/deals-page-client';

export default async function DealsPage() {
  const pipelines = await getPipelines();

  const firstPipelineId = pipelines[0]?.id ?? '';

  // Initial fetch for kanban view: active deals only (closed_at IS NULL)
  const { data: initialDeals, count: initialCount } = await getDeals({
    filters: firstPipelineId ? { pipeline_id: firstPipelineId, is_closed: false } : undefined,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Deals"
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Deals' },
        ]}
      />
      <DealsPageClient
        pipelines={(pipelines as unknown as Parameters<typeof DealsPageClient>[0]['pipelines']) ?? []}
        initialDeals={initialDeals}
        initialCount={initialCount}
        initialPipelineId={firstPipelineId}
      />
    </div>
  );
}
