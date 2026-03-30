'use client';

import { RouteErrorCard } from '@/components/admin/route-error-card';

export default function ContactsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteErrorCard
      title="Contacten laden mislukt"
      description="Er is een onverwachte fout opgetreden bij het laden van contacten."
      error={error}
      reset={reset}
    />
  );
}
