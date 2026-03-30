'use client';

import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

type RouteErrorCardProps = {
  title: string;
  description: string;
  error: Error & { digest?: string };
  reset: () => void;
};

export function RouteErrorCard({ title, description, error, reset }: RouteErrorCardProps) {
  return (
    <div className="flex items-center justify-center p-12">
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{description}</p>
          {process.env.NODE_ENV === 'development' && (
            <pre className="mt-4 max-h-40 overflow-auto rounded bg-muted p-3 text-xs">{error.message}</pre>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={() => reset()}>Opnieuw proberen</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
