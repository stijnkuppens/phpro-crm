'use client';

import { RouteErrorCard } from '@/components/admin/route-error-card';

export default function InviteUserError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteErrorCard
      title="Fout bij laden van uitnodiging"
      description="Er is een onverwachte fout opgetreden bij het laden van het uitnodigingsformulier."
      error={error}
      reset={reset}
    />
  );
}
