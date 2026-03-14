'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

export default function TasksError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex items-center justify-center p-12">
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Fout bij laden van taken
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Er is een onverwachte fout opgetreden bij het laden van taken.
          </p>
          {process.env.NODE_ENV === 'development' && (
            <pre className="mt-4 max-h-40 overflow-auto rounded bg-muted p-3 text-xs">
              {error.message}
            </pre>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={reset}>Opnieuw proberen</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
