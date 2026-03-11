'use client';

import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { z } from 'zod';
import { createBrowserClient } from '@/lib/supabase/client';
import { PageHeader } from '@/components/admin/page-header';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';

const EntityForm = dynamic(() => import('@/components/admin/entity-form'), {
  loading: () => <Skeleton className="h-64 w-full" />,
});

const contactSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  company: z.string().optional(),
  notes: z.string().optional(),
});

type ContactForm = z.infer<typeof contactSchema>;

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
      <EntityForm
        schema={contactSchema}
        onSubmit={async (data) => {
          const supabase = createBrowserClient();
          const { error } = await supabase.from('contacts').insert({
            name: data.name,
            email: data.email || null,
            phone: data.phone || null,
            company: data.company || null,
            notes: data.notes || null,
          });
          if (error) throw new Error(error.message);
        }}
        onSuccess={() => router.push('/admin/contacts')}
        submitLabel="Create Contact"
      >
        {(form) => (
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">Name *</label>
              <Input id="name" {...form.register('name')} />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">{String(form.formState.errors.name.message)}</p>
              )}
            </div>
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">Email</label>
              <Input id="email" type="email" {...form.register('email')} />
            </div>
            <div className="space-y-2">
              <label htmlFor="phone" className="text-sm font-medium">Phone</label>
              <Input id="phone" {...form.register('phone')} />
            </div>
            <div className="space-y-2">
              <label htmlFor="company" className="text-sm font-medium">Company</label>
              <Input id="company" {...form.register('company')} />
            </div>
            <div className="space-y-2">
              <label htmlFor="notes" className="text-sm font-medium">Notes</label>
              <Textarea id="notes" {...form.register('notes')} />
            </div>
          </div>
        )}
      </EntityForm>
    </div>
  );
}
