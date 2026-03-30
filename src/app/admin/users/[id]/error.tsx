'use client';

import { RouteErrorCard } from '@/components/admin/route-error-card';

export default function UserError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteErrorCard
      title="Fout bij laden van gebruiker"
      description="Er is een onverwachte fout opgetreden bij het laden van gebruiker."
      error={error}
      reset={reset}
    />
  );
}
