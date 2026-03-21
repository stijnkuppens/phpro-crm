import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/admin/page-header';
import { getAccount } from '@/features/accounts/queries/get-account';
import { getDealsByAccount } from '@/features/deals/queries/get-deals-by-account';
import { getContract } from '@/features/contracts/queries/get-contract';
import { getHourlyRates } from '@/features/contracts/queries/get-hourly-rates';
import { getSlaRates } from '@/features/contracts/queries/get-sla-rates';
import { getConsultantsByAccount } from '@/features/consultants/queries/get-consultants-by-account';
import { getAccountRevenue } from '@/features/revenue/queries/get-account-revenue';
import { getContactsByAccount } from '@/features/contacts/queries/get-contacts-by-account';
import { getActivities } from '@/features/activities/queries/get-activities';
import { getCommunications } from '@/features/communications/queries/get-communications';
import { getReferenceOptions } from '@/features/reference-data/queries/get-reference-options';
import { getIndexationConfig } from '@/features/indexation/queries/get-indexation-config';
import { getIndexationDraft } from '@/features/indexation/queries/get-indexation-draft';
import { getIndexationHistory } from '@/features/indexation/queries/get-indexation-history';
import { AccountDetail } from '@/features/accounts/components/account-detail';
import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const account = await getAccount(id);
  return { title: account ? account.name : 'Account' };
}

export default async function AccountDetailPage({ params }: Props) {
  const { id } = await params;
  const account = await getAccount(id);

  if (!account) {
    notFound();
  }

  const [deals, contract, hourlyRates, slaRates, consultants, accountRevenue, contacts, activities, communications, internalPeople, consultantRolesRaw, indexationConfig, indexationDraft, indexationHistory] = await Promise.all([
    getDealsByAccount(id),
    getContract(id),
    getHourlyRates(id),
    getSlaRates(id),
    getConsultantsByAccount(id),
    getAccountRevenue(id),
    getContactsByAccount(id),
    getActivities({ filters: { account_id: id }, pageSize: 50 }),
    getCommunications({ filters: { account_id: id }, pageSize: 50 }),
    getReferenceOptions('ref_internal_people'),
    getReferenceOptions('ref_consultant_roles'),
    getIndexationConfig(id),
    getIndexationDraft(id),
    getIndexationHistory(id),
  ]);

  const consultantRoles = consultantRolesRaw.map((r) => ({ value: r.name, label: r.name }));

  return (
    <div className="space-y-6">
      <PageHeader
        title={account.name}
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Accounts', href: '/admin/accounts' },
          { label: account.name },
        ]}
        actions={
          <Button render={<Link href={`/admin/accounts/${id}/edit`} />}>
            <Pencil />
            Bewerken
          </Button>
        }
      />
      <AccountDetail
        account={account}
        deals={deals}
        contract={contract}
        hourlyRates={hourlyRates}
        slaRates={slaRates}
        consultants={consultants}
        accountRevenue={accountRevenue}
        contacts={contacts}
        activities={activities.data}
        activitiesCount={activities.count}
        communications={communications.data}
        communicationsCount={communications.count}
        internalPeople={internalPeople}
        consultantRoles={consultantRoles}
        indexationConfig={indexationConfig}
        indexationDraft={indexationDraft}
        indexationHistory={indexationHistory}
      />
    </div>
  );
}
