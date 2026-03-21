import { PageHeader } from '@/components/admin/page-header';
import { getBenchConsultants } from '@/features/bench/queries/get-bench-consultants';
import { getAccounts } from '@/features/accounts/queries/get-accounts';
import { getReferenceOptions } from '@/features/reference-data/queries/get-reference-options';
import { BenchGrid } from '@/features/bench/components/bench-grid';
import { createServerClient } from '@/lib/supabase/server';

export default async function BenchPage() {
  const supabase = await createServerClient();

  const [consultants, { data: pipelines }, accountsResult, rolesRaw] = await Promise.all([
    getBenchConsultants(),
    supabase
      .from('pipelines')
      .select('id, name, type, stages:pipeline_stages(id, name, sort_order, is_closed)')
      .order('sort_order', { ascending: true }),
    getAccounts({ pageSize: 9999 }),
    getReferenceOptions('ref_consultant_roles'),
  ]);

  const accounts = accountsResult.data.map((a) => ({
    id: a.id,
    name: a.name,
    domain: a.domain,
    type: a.type,
    city: null as string | null,
  }));

  const roles = rolesRaw.map((r) => ({ value: r.name, label: r.name }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bench"
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Bench' },
        ]}
      />
      <BenchGrid consultants={consultants} pipelines={pipelines ?? []} accounts={accounts} roles={roles} />
    </div>
  );
}
