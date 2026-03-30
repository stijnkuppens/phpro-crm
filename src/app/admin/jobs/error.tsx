'use client';

import { RouteErrorCard } from '@/components/admin/route-error-card';

export default function JobsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteErrorCard
      title="Fout bij laden van jobs"
      description="Er is een onverwachte fout opgetreden bij het laden van jobs."
      error={error}
      reset={reset}
    />
  );
}
