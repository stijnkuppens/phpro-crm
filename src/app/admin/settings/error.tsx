'use client';

import { RouteErrorCard } from '@/components/admin/route-error-card';

export default function SettingsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteErrorCard
      title="Fout bij laden van instellingen"
      description="Er is een onverwachte fout opgetreden bij het laden van de instellingen."
      error={error}
      reset={reset}
    />
  );
}
