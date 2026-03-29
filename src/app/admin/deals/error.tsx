'use client';

import { RouteErrorCard } from '@/components/admin/route-error-card';

export default function DealsError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <RouteErrorCard
      title="Fout bij laden van deals"
      description="Er is een onverwachte fout opgetreden bij het laden van deals."
      error={error}
      reset={reset}
    />
  );
}
