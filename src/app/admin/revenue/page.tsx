import { PageHeader } from '@/components/admin/page-header';
import { getDivisions } from '@/features/revenue/queries/get-divisions';
import { getRevenueClients } from '@/features/revenue/queries/get-revenue-clients';
import { getRevenueEntries } from '@/features/revenue/queries/get-revenue-entries';
import { RevenuePageClient } from '@/features/revenue/components/revenue-page-client';

export default async function RevenuePage() {
  const [divisions, clients, entries] = await Promise.all([
    getDivisions(),
    getRevenueClients(),
    getRevenueEntries({ years: [2023, 2024, 2025, 2026] }),
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
        years={[2023, 2024, 2025, 2026]}
      />
    </div>
  );
}
