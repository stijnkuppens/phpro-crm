'use client';

import { RouteErrorCard } from '@/components/admin/route-error-card';

export default function NewAccountError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteErrorCard
      title="Fout bij laden van nieuw account"
      description="Er is een onverwachte fout opgetreden bij het laden van het formulier."
      error={error}
      reset={reset}
    />
  );
}
