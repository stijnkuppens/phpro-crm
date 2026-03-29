'use client';

import { RouteErrorCard } from '@/components/admin/route-error-card';

export default function ReferenceDataError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <RouteErrorCard
      title="Referentiegegevens laden mislukt"
      description="Er is een onverwachte fout opgetreden bij het laden van de referentiegegevens."
      error={error}
      reset={reset}
    />
  );
}
