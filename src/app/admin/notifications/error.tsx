'use client';

import { RouteErrorCard } from '@/components/admin/route-error-card';

export default function NotificationsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteErrorCard
      title="Fout bij laden van meldingen"
      description="Er is een onverwachte fout opgetreden bij het laden van meldingen."
      error={error}
      reset={reset}
    />
  );
}
