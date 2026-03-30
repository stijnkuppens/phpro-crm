'use client';

import { RouteErrorCard } from '@/components/admin/route-error-card';

export default function UserEditError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteErrorCard
      title="Fout bij laden van gebruiker"
      description="Er is een onverwachte fout opgetreden."
      error={error}
      reset={reset}
    />
  );
}
