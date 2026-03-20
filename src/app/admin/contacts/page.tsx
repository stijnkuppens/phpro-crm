import { PageHeader } from '@/components/admin/page-header';
import { ContactList } from '@/features/contacts/components/contact-list';
import { getContacts } from '@/features/contacts/queries/get-contacts';
import { createServerClient } from '@/lib/supabase/server';

export default async function ContactsPage() {
  const supabase = await createServerClient();
  const [{ data, count }, { data: accounts }] = await Promise.all([
    getContacts(),
    supabase.from('accounts').select('id, name').order('name'),
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
        accounts={[...new Map((accounts ?? []).map((a) => [a.name, { id: a.id, name: a.name }])).values()]}
      />
    </div>
  );
}
