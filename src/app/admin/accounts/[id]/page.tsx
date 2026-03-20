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
import { AccountDetail } from '@/features/accounts/components/account-detail';
import { Pencil } from 'lucide-react';

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

  const [deals, contract, hourlyRates, slaRates, consultants, accountRevenue, contacts, activities, communications] = await Promise.all([
    getDealsByAccount(id),
    getContract(id),
    getHourlyRates(id),
    getSlaRates(id),
    getConsultantsByAccount(id),
    getAccountRevenue(id),
    getContactsByAccount(id),
    getActivities({ filters: { account_id: id }, pageSize: 50 }),
    getCommunications({ filters: { account_id: id }, pageSize: 50 }),
  ]);

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
          <Link
            href={`/admin/accounts/${id}/edit`}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Pencil className="h-4 w-4" />
            Bewerken
          </Link>
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
      />
    </div>
  );
}
