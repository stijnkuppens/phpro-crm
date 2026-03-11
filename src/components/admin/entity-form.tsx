'use client';

import { useForm, type DefaultValues, type FieldValues, type Path } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import type { ReactNode } from 'react';

type EntityFormProps<T extends FieldValues> = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  schema: any;
  defaultValues?: DefaultValues<T>;
  onSubmit: (data: T) => Promise<void>;
  onSuccess?: () => void;
  submitLabel?: string;
  children: (form: ReturnType<typeof useForm<T>>) => ReactNode;
};

export default function EntityForm<T extends FieldValues>({
  schema,
  defaultValues,
  onSubmit,
  onSuccess,
  submitLabel = 'Save',
  children,
}: EntityFormProps<T>) {
  const form = useForm<T>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      await onSubmit(data);
      toast.success('Saved successfully');
      onSuccess?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    }
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {children(form)}
      <div className="flex items-center gap-2">
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

// Helper component for form fields
export function FormField<T extends FieldValues>({
  form,
  name,
  label,
  children,
}: {
  form: ReturnType<typeof useForm<T>>;
  name: Path<T>;
  label: string;
  children: (field: ReturnType<typeof form.register>) => ReactNode;
}) {
  const error = form.formState.errors[name];
  return (
    <div className="space-y-2">
      <label htmlFor={name} className="text-sm font-medium">
        {label}
      </label>
      {children(form.register(name))}
      {error && (
        <p className="text-sm text-destructive">{error.message as string}</p>
      )}
    </div>
  );
}
