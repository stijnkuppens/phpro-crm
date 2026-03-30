import { AccountDealsPanel } from '@/features/deals/components/account-deals-panel';
import { getDeals } from '@/features/deals/queries/get-deals';
import { getPipelines } from '@/features/deals/queries/get-pipelines';
import { createServerClient } from '@/lib/supabase/server';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function DealsPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createServerClient();

  const [pipelines, { data: initialDeals, count: initialCount }, { data: ownerRows }] = await Promise.all([
    getPipelines(),
    getDeals({ filters: { account_id: id } }),
    supabase.from('user_profiles').select('id, full_name').order('full_name'),
  ]);

  return (
    <AccountDealsPanel
      pipelines={(pipelines as unknown as Parameters<typeof AccountDealsPanel>[0]['pipelines']) ?? []}
      initialDeals={initialDeals}
      initialCount={initialCount}
      owners={(ownerRows ?? []).map((o) => ({ id: o.id, name: o.full_name ?? '' }))}
      accountId={id}
    />
  );
}
