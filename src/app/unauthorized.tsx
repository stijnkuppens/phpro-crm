import { ShieldX } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50 px-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldX className="h-5 w-5 text-muted-foreground" />
              Niet bevoegd
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Je hebt geen toegang tot deze pagina. Log in met een account dat de benodigde rechten heeft.
            </p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" render={<Link href="/login" />}>
              Naar inlogpagina
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
