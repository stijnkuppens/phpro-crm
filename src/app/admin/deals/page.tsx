import { PageHeader } from '@/components/admin/page-header';
import { createServerClient } from '@/lib/supabase/server';
import { getDeals } from '@/features/deals/queries/get-deals';
import { DealsPageClient } from '@/features/deals/components/deals-page-client';

export default async function DealsPage() {
  const supabase = await createServerClient();

  const { data: pipelines } = await supabase
    .from('pipelines')
    .select(`
      id, name, type,
      stages:pipeline_stages(id, name, color, sort_order, is_closed, is_won, is_longterm, probability)
    `)
    .order('sort_order', { ascending: true });

  const firstPipelineId = pipelines?.[0]?.id ?? '';

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
