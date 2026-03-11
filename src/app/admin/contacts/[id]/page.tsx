import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createServerClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/admin/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Pencil } from 'lucide-react';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ContactDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createServerClient();

  const { data: contact, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !contact) notFound();

  const fields = [
    { label: 'Email', value: contact.email },
    { label: 'Phone', value: contact.phone },
    { label: 'Company', value: contact.company },
    { label: 'Notes', value: contact.notes },
    { label: 'Created', value: new Date(contact.created_at).toLocaleDateString() },
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title={contact.name}
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Contacts', href: '/admin/contacts' },
          { label: contact.name },
        ]}
        actions={
          <Link href={`/admin/contacts/${id}/edit`}>
            <Button>
              <Pencil className="mr-2 h-4 w-4" /> Edit
            </Button>
          </Link>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>Contact Details</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2">
            {fields.map((field) => (
              <div key={field.label}>
                <dt className="text-sm font-medium text-muted-foreground">{field.label}</dt>
                <dd className="mt-1 text-sm">{field.value ?? '—'}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
