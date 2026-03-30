import { Pencil } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { AccountOverviewTab } from '@/features/accounts/components/account-overview-tab';
import { getAccount } from '@/features/accounts/queries/get-account';
import { getContactsByAccount } from '@/features/contacts/queries/get-contacts-by-account';
import { getContract } from '@/features/contracts/queries/get-contract';
import { getReferenceOptions } from '@/features/reference-data/queries/get-reference-options';

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
  return (
    <>
      <div className="flex justify-end">
        <Button nativeButton={false} render={<Link href={`/admin/accounts/${id}/edit`} />}>
          <Pencil /> Bewerken
        </Button>
      </div>
      <AccountOverviewTab
        account={account}
        contract={contract}
        contacts={contacts}
        internalPeople={internalPeople}
      />
    </>
  );
}
