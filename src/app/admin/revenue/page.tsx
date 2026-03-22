import { PageHeader } from '@/components/admin/page-header';
import { getDivisions } from '@/features/revenue/queries/get-divisions';
import { getRevenueClients } from '@/features/revenue/queries/get-revenue-clients';
import { getRevenueEntries } from '@/features/revenue/queries/get-revenue-entries';
import { RevenuePageClient } from '@/features/revenue/components/revenue-page-client';

export default async function RevenuePage() {
  const currentYear = new Date().getFullYear();
  const years = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1];

  const [divisions, clients, entries] = await Promise.all([
    getDivisions(),
    getRevenueClients(),
    getRevenueEntries({ years }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Revenue"
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Revenue' },
        ]}
      />
      <RevenuePageClient
        clients={clients}
        divisions={divisions}
        entries={entries}
        years={years}
      />
    </div>
  );
}
