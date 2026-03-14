import { PageHeader } from '@/components/admin/page-header';
import { getBenchConsultants } from '@/features/bench/queries/get-bench-consultants';
import { BenchGrid } from '@/features/bench/components/bench-grid';

export default async function BenchPage() {
  const consultants = await getBenchConsultants();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bench"
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Bench' },
        ]}
      />
      <BenchGrid consultants={consultants} />
    </div>
  );
}
