'use client';

import { RouteErrorCard } from '@/components/admin/route-error-card';

export default function TasksError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <RouteErrorCard
      title="Fout bij laden van taken"
      description="Er is een onverwachte fout opgetreden bij het laden van taken."
      error={error}
      reset={reset}
    />
  );
}
