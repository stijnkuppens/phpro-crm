import { AccountCommunicationsTab } from '@/features/accounts/components/account-communications-tab';
import { getCommunications } from '@/features/communications/queries/get-communications';
import { getContactsByAccount } from '@/features/contacts/queries/get-contacts-by-account';
import { getDealsByAccount } from '@/features/deals/queries/get-deals-by-account';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function CommunicatiePage({ params }: Props) {
  const { id } = await params;
  const [communications, contacts, deals] = await Promise.all([
    getCommunications({ filters: { account_id: id }, pageSize: 25 }),
    getContactsByAccount(id),
    getDealsByAccount(id),
  ]);
  return (
    <AccountCommunicationsTab
      accountId={id}
      initialData={communications.data}
      initialCount={communications.count}
      contacts={contacts.map((c) => ({ id: c.id, first_name: c.first_name, last_name: c.last_name }))}
      deals={deals.map((d) => ({ id: d.id, title: d.title }))}
    />
  );
}
