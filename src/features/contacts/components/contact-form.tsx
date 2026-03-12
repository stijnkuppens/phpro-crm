'use client';

import dynamic from 'next/dynamic';
import type { FieldValues } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { contactSchema, type ContactFormValues } from '../types';

const EntityForm = dynamic(() => import('@/components/admin/entity-form'), {
  loading: () => <Skeleton className="h-64 w-full" />,
});

type ContactFormProps = {
  defaultValues?: ContactFormValues;
  onSubmit: (data: ContactFormValues) => Promise<void>;
  onSuccess?: () => void;
  submitLabel?: string;
};

export function ContactForm({
  defaultValues,
  onSubmit,
  onSuccess,
  submitLabel = 'Save',
}: ContactFormProps) {
  return (
    <EntityForm
      schema={contactSchema}
      defaultValues={defaultValues}
      onSubmit={onSubmit as (data: FieldValues) => Promise<void>}
      onSuccess={onSuccess}
      submitLabel={submitLabel}
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
  );
}
