import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/admin/page-header';
import { getContact } from '@/features/contacts/queries/get-contact';
import { ContactDetail } from '@/features/contacts/components/contact-detail';

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const contact = await getContact(id);
  return {
    title: contact
      ? `${contact.first_name} ${contact.last_name}`
      : 'Contact',
  };
}

export default async function ContactDetailPage({ params }: Props) {
  const { id } = await params;
  const contact = await getContact(id);

  if (!contact) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${contact.first_name} ${contact.last_name}`}
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Contacts', href: '/admin/contacts' },
          { label: `${contact.first_name} ${contact.last_name}` },
        ]}
      />
      <ContactDetail contact={contact} />
    </div>
  );
}
