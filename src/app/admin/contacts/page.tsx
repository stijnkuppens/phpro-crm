import { getAccountNames } from '@/features/accounts/queries/get-account-names';
import { ContactList } from '@/features/contacts/components/contact-list';
import { getContacts } from '@/features/contacts/queries/get-contacts';

export default async function ContactsPage() {
  const [{ data, count }, accounts] = await Promise.all([getContacts(), getAccountNames()]);

  return (
    <ContactList initialData={data} initialCount={count} accounts={accounts.map((a) => ({ id: a.id, name: a.name }))} />
  );
}
