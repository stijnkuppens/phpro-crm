import { PageHeader } from '@/components/admin/page-header';
import { ContactList } from '@/features/contacts/components/contact-list';

export default function ContactsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Contacts"
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Contacts' },
        ]}
      />
      <ContactList />
    </div>
  );
}
