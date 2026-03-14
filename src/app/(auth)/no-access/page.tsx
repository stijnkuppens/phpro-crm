import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldX } from 'lucide-react';

export const metadata = { title: 'No Access' };

export default function NoAccessPage() {
  async function signOutAction() {
    'use server';
    const supabase = await createServerClient();
    await supabase.auth.signOut();
    redirect('/login');
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldX className="h-5 w-5 text-muted-foreground" />
          No access
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Your account does not have a role assigned. Contact an administrator to
          get access.
        </p>
      </CardContent>
      <CardFooter>
        <form action={signOutAction}>
          <Button variant="outline">Sign out</Button>
        </form>
      </CardFooter>
    </Card>
  );
}
