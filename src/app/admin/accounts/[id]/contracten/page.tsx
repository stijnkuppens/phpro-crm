import { ContractsTab } from '@/features/contracts/components/contracts-tab';
import { getContract } from '@/features/contracts/queries/get-contract';
import { getHourlyRates } from '@/features/contracts/queries/get-hourly-rates';
import { getSlaRates } from '@/features/contracts/queries/get-sla-rates';
import { getIndexationConfig } from '@/features/indexation/queries/get-indexation-config';
import { getIndexationDraft } from '@/features/indexation/queries/get-indexation-draft';
import { getIndexationHistory } from '@/features/indexation/queries/get-indexation-history';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ContractenPage({ params }: Props) {
  const { id } = await params;
  const [contract, hourlyRates, slaRates, indexationConfig, indexationDraft, indexationHistory] = await Promise.all([
    getContract(id),
    getHourlyRates(id),
    getSlaRates(id),
    getIndexationConfig(id),
    getIndexationDraft(id),
    getIndexationHistory(id),
  ]);
  return (
    <ContractsTab
      accountId={id}
      contract={contract}
      hourlyRates={hourlyRates}
      slaRates={slaRates}
      indexationConfig={indexationConfig ?? null}
      indexationDraft={indexationDraft ?? null}
      indexationHistory={indexationHistory ?? []}
    />
  );
}
