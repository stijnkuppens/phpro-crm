import { ShieldX } from 'lucide-react';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { createServerClient } from '@/lib/supabase/server';

export const metadata = { title: 'Geen toegang' };

export default function NoAccessPage() {
  async function signOutAction() {
    'use server';
    const supabase = await createServerClient();
    await supabase.auth.signOut();
    redirect('/login');
  }

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
              Je account heeft nog geen rol toegewezen. Neem contact op met een administrator om
              toegang te krijgen.
            </p>
          </CardContent>
          <CardFooter>
            <form action={signOutAction}>
              <Button variant="outline">Uitloggen</Button>
            </form>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
