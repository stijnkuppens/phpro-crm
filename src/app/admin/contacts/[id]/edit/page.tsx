'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/components/admin/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { ContactForm } from '@/features/contacts/components/contact-form';
import { updateContact } from '@/features/contacts/actions/update-contact';
import { createBrowserClient } from '@/lib/supabase/client';
import type { ContactFormValues } from '@/features/contacts/types';

export default function EditContactPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [contact, setContact] = useState<ContactFormValues | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createBrowserClient();
      const { data } = await supabase
        .from('contacts')
        .select('name, email, phone, company, notes')
        .eq('id', id)
        .single();
      if (data) setContact(data as ContactFormValues);
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) return <Skeleton className="h-96 w-full" />;
  if (!contact) return <p>Contact not found</p>;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="Edit Contact"
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Contacts', href: '/admin/contacts' },
          { label: 'Edit' },
        ]}
      />
      <ContactForm
        defaultValues={contact}
        onSubmit={(data) => updateContact(id, data)}
        onSuccess={() => router.push('/admin/contacts')}
        submitLabel="Save Changes"
      />
    </div>
  );
}
