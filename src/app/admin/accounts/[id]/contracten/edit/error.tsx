'use client';

import { RouteErrorCard } from '@/components/admin/route-error-card';

export default function ContractEditError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <RouteErrorCard
      title="Fout bij laden van contract bewerken"
      description="Er is een onverwachte fout opgetreden bij het laden van contract bewerken."
      error={error}
      reset={reset}
    />
  );
}
