'use client';

import { RouteErrorCard } from '@/components/admin/route-error-card';

export default function ActivitiesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteErrorCard
      title="Fout bij laden van activiteiten"
      description="Er is een onverwachte fout opgetreden bij het laden van activiteiten."
      error={error}
      reset={reset}
    />
  );
}
