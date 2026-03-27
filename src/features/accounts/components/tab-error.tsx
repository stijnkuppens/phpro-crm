'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { logger } from '@/lib/logger';

/** Shared tab error boundary — used by all account tab routes */
export function TabError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { logger.error({ err: error }, 'Tab error'); }, [error]);

  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-xl border bg-card py-16">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-sm font-medium">Er ging iets mis bij het laden van dit tabblad.</p>
      <Button variant="outline" size="sm" onClick={reset}>Opnieuw proberen</Button>
    </div>
  );
}
