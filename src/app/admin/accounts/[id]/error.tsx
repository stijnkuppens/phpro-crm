'use client';

import { RouteErrorCard } from '@/components/admin/route-error-card';

export default function AccountDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteErrorCard
      title="Fout bij laden van account"
      description="Er is een onverwachte fout opgetreden bij het laden van dit account."
      error={error}
      reset={reset}
    />
  );
}
