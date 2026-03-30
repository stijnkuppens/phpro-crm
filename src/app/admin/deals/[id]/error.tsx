'use client';

import { RouteErrorCard } from '@/components/admin/route-error-card';

export default function DealDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteErrorCard
      title="Fout bij laden van deal"
      description="Er is een onverwachte fout opgetreden bij het laden van deze deal."
      error={error}
      reset={reset}
    />
  );
}
