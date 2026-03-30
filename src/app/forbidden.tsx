import { ShieldX } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function ForbiddenPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50 px-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldX className="h-5 w-5 text-muted-foreground" />
              Geen toegang
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Je hebt geen toestemming om deze pagina te bekijken. Neem contact op met een
              administrator als je denkt dat dit een fout is.
            </p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" render={<Link href="/admin" />}>
              Terug naar dashboard
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
