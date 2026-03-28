import { notFound } from 'next/navigation';
import { getAccount } from '@/features/accounts/queries/get-account';
import { getContract } from '@/features/contracts/queries/get-contract';
import { getContactsByAccount } from '@/features/contacts/queries/get-contacts-by-account';
import { getReferenceOptions } from '@/features/reference-data/queries/get-reference-options';
import { AccountOverviewTab } from '@/features/accounts/components/account-overview-tab';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function AccountOverviewPage({ params }: Props) {
  const { id } = await params;
  const [account, contract, contacts, internalPeople] = await Promise.all([
    getAccount(id),
    getContract(id),
    getContactsByAccount(id),
    getReferenceOptions('ref_internal_people'),
  ]);
  if (!account) notFound();
  return <AccountOverviewTab account={account} contract={contract} contacts={contacts} internalPeople={internalPeople} />;
}
