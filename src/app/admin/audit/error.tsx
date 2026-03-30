'use client';

import { RouteErrorCard } from '@/components/admin/route-error-card';

export default function AuditError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteErrorCard
      title="Fout bij laden van auditlog"
      description="Er is een onverwachte fout opgetreden bij het laden van het auditlog."
      error={error}
      reset={reset}
    />
  );
}
