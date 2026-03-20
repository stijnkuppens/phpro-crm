import { PageHeader } from '@/components/admin/page-header';
import { getDivisions } from '@/features/revenue/queries/get-divisions';
import { getRevenueClients } from '@/features/revenue/queries/get-revenue-clients';
import { getRevenueEntries } from '@/features/revenue/queries/get-revenue-entries';
import { PrognoseEditor } from '@/features/prognose/components/prognose-editor';

const FORECAST_YEAR = new Date().getFullYear() + 1;
const LAST_KNOWN_YEAR = new Date().getFullYear();

export default async function PrognosePage() {
  const [divisions, clients, entries] = await Promise.all([
    getDivisions(),
    getRevenueClients(),
    getRevenueEntries({ years: [LAST_KNOWN_YEAR - 1, LAST_KNOWN_YEAR, FORECAST_YEAR] }),
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
        forecastYear={FORECAST_YEAR}
        lastKnownYear={LAST_KNOWN_YEAR}
      />
    </div>
  );
}
