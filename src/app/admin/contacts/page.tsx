import { PageHeader } from '@/components/admin/page-header';
import { ExportDropdown } from '@/components/admin/export-dropdown';
import { ContactList } from '@/features/contacts/components/contact-list';
import { getContacts } from '@/features/contacts/queries/get-contacts';
import { getAccountNames } from '@/features/accounts/queries/get-account-names';
import { contactExportColumns, CONTACT_EXPORT_SELECT } from '@/features/contacts/export-columns';

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
        actions={
          <ExportDropdown
            entity="contacts"
            columns={contactExportColumns}
            filters={{ sort: { column: 'last_name', direction: 'asc' } }}
            selectQuery={CONTACT_EXPORT_SELECT}
          />
        }
      />
      <ContactList
        initialData={data}
        initialCount={count}
        accounts={accounts.map((a) => ({ id: a.id, name: a.name }))}
      />
    </div>
  );
}
