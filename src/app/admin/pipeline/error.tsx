'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { logger } from '@/lib/logger';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { logger.error({ err: error }, 'Pipeline page error'); }, [error]);

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20">
      <AlertCircle className="h-10 w-10 text-destructive" />
      <h2 className="text-lg font-semibold">Er ging iets mis</h2>
      <p className="text-sm text-muted-foreground">Er is een onverwachte fout opgetreden bij het laden van deze pagina.</p>
      <Button variant="outline" onClick={reset}>Opnieuw proberen</Button>
    </div>
  );
}
