'use client';

import { RouteErrorCard } from '@/components/admin/route-error-card';

export default function AccountsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteErrorCard
      title="Fout bij laden van accounts"
      description="Er is een onverwachte fout opgetreden bij het laden van accounts."
      error={error}
      reset={reset}
    />
  );
}
