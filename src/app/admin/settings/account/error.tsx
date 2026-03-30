'use client';

import { RouteErrorCard } from '@/components/admin/route-error-card';

export default function AccountSettingsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteErrorCard
      title="Fout bij laden van accountinstellingen"
      description="Er is een onverwachte fout opgetreden."
      error={error}
      reset={reset}
    />
  );
}
