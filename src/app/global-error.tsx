'use client';

import { Button } from '@/components/ui/button';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="nl">
      <body className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="max-w-md space-y-4 text-center">
          <h1 className="text-2xl font-bold">Er is iets misgegaan</h1>
          <p className="text-muted-foreground">Een onverwachte fout is opgetreden.</p>
          {process.env.NODE_ENV === 'development' && (
            <pre className="mt-4 max-h-40 overflow-auto rounded bg-muted p-3 text-left text-xs">{error.message}</pre>
          )}
          <Button onClick={reset}>Opnieuw proberen</Button>
        </div>
      </body>
    </html>
  );
}
