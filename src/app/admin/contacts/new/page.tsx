'use client';

import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/admin/page-header';
import { ContactForm } from '@/features/contacts/components/contact-form';
import { createContact } from '@/features/contacts/actions/create-contact';

export default function NewContactPage() {
  const router = useRouter();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="Add Contact"
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Contacts', href: '/admin/contacts' },
          { label: 'New' },
        ]}
      />
      <ContactForm
        onSubmit={(data) => createContact(data)}
        onSuccess={() => router.push('/admin/contacts')}
        submitLabel="Create Contact"
      />
    </div>
  );
}
