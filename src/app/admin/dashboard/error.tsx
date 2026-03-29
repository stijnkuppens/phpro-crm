'use client';

import { RouteErrorCard } from '@/components/admin/route-error-card';

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <RouteErrorCard
      title="Fout bij laden van dashboard"
      description="Er is een onverwachte fout opgetreden bij het laden van het dashboard."
      error={error}
      reset={reset}
    />
  );
}
