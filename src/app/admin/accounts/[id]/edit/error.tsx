'use client';

import { RouteErrorCard } from '@/components/admin/route-error-card';

export default function AccountEditError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <RouteErrorCard
      title="Fout bij laden van account bewerken"
      description="Er is een onverwachte fout opgetreden bij het laden van account bewerken."
      error={error}
      reset={reset}
    />
  );
}
