import { PageHeader } from '@/components/admin/page-header';
import { getDivisions } from '@/features/revenue/queries/get-divisions';
import { getRevenueClients } from '@/features/revenue/queries/get-revenue-clients';
import { getRevenueEntries } from '@/features/revenue/queries/get-revenue-entries';
import { PrognoseEditor } from '@/features/prognose/components/prognose-editor';

export default async function PrognosePage() {
  const currentYear = new Date().getFullYear();
  const forecastYear = currentYear + 1;

  const [divisions, clients, entries] = await Promise.all([
    getDivisions(),
    getRevenueClients(),
    getRevenueEntries({ years: [currentYear - 1, currentYear, forecastYear] }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Prognose"
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Prognose' },
        ]}
      />
      <PrognoseEditor
        clients={clients}
        divisions={divisions}
        entries={entries}
        forecastYear={forecastYear}
        lastKnownYear={currentYear}
      />
    </div>
  );
}
