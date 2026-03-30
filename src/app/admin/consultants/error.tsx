'use client';

import { RouteErrorCard } from '@/components/admin/route-error-card';

export default function ConsultantsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteErrorCard
      title="Fout bij laden consultants"
      description="Er is een onverwachte fout opgetreden bij het laden van de consultants."
      error={error}
      reset={reset}
    />
  );
}
