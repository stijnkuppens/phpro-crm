import { getDeals } from '@/features/deals/queries/get-deals';
import { getPipelines } from '@/features/deals/queries/get-pipelines';
import { DealsPageClient } from '@/features/deals/components/deals-page-client';
import { createServerClient } from '@/lib/supabase/server';

export default async function DealsPage() {
  const supabase = await createServerClient();

  const [pipelines, { data: initialDeals, count: initialCount }, { data: ownerRows }] = await Promise.all([
    getPipelines(),
    getDeals({}),
    supabase.from('user_profiles').select('id, full_name').order('full_name'),
  ]);

  return (
    <DealsPageClient
      pipelines={(pipelines as unknown as Parameters<typeof DealsPageClient>[0]['pipelines']) ?? []}
      initialDeals={initialDeals}
      initialCount={initialCount}
      owners={(ownerRows ?? []).map((o) => ({ id: o.id, name: o.full_name ?? '' }))}
    />
  );
}
