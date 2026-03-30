'use client';

import { RouteErrorCard } from '@/components/admin/route-error-card';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteErrorCard
      title="Er ging iets mis"
      description="Er is een onverwachte fout opgetreden bij het laden van deze pagina."
      error={error}
      reset={reset}
    />
  );
}
