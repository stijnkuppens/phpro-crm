import type { Metadata } from 'next';
import { ContractEditPage } from '@/features/contracts/components/contract-edit-page';
import { getContract } from '@/features/contracts/queries/get-contract';
import { getHourlyRates } from '@/features/contracts/queries/get-hourly-rates';
import { getSlaRates } from '@/features/contracts/queries/get-sla-rates';
import { getIndexationConfig } from '@/features/indexation/queries/get-indexation-config';

type Props = {
  params: Promise<{ id: string }>;
};

export const metadata: Metadata = { title: 'Contracten bewerken' };

export default async function ContractenEditPage({ params }: Props) {
  const { id } = await params;
  const [contract, hourlyRates, slaRates, indexationConfig] = await Promise.all([
    getContract(id),
    getHourlyRates(id),
    getSlaRates(id),
    getIndexationConfig(id),
  ]);

  return (
    <ContractEditPage
      accountId={id}
      contract={contract}
      hourlyRates={hourlyRates}
      slaRates={slaRates}
      indexationConfig={indexationConfig ?? null}
    />
  );
}
