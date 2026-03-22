import { getContactsByAccount } from '@/features/contacts/queries/get-contacts-by-account';
import { AccountContactsTab } from '@/features/accounts/components/account-contacts-tab';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ContactsPage({ params }: Props) {
  const { id } = await params;
  const contacts = await getContactsByAccount(id);
  return <AccountContactsTab accountId={id} initialData={contacts} initialCount={contacts.length} />;
}
