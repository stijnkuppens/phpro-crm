'use client';

import { RouteErrorCard } from '@/components/admin/route-error-card';

export default function UsersError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteErrorCard
      title="Fout bij laden van gebruikers"
      description="Er is een onverwachte fout opgetreden bij het laden van gebruikers."
      error={error}
      reset={reset}
    />
  );
}
