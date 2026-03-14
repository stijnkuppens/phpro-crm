import { PageHeader } from '@/components/admin/page-header';
import { ContactList } from '@/features/contacts/components/contact-list';
import { getContacts } from '@/features/contacts/queries/get-contacts';

export default async function ContactsPage() {
  const { data, count } = await getContacts();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contacts"
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Contacts' },
        ]}
      />
      <ContactList initialData={data} initialCount={count} />
    </div>
  );
}
