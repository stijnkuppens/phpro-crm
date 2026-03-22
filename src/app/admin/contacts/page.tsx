import { PageHeader } from '@/components/admin/page-header';
import { ContactList } from '@/features/contacts/components/contact-list';
import { getContacts } from '@/features/contacts/queries/get-contacts';
import { getAccountNames } from '@/features/accounts/queries/get-account-names';

export default async function ContactsPage() {
  const [{ data, count }, accounts] = await Promise.all([
    getContacts(),
    getAccountNames(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contacts"
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Contacts' },
        ]}
      />
      <ContactList
        initialData={data}
        initialCount={count}
        accounts={accounts.map((a) => ({ id: a.id, name: a.name }))}
      />
    </div>
  );
}
