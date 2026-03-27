'use client';

import { useActionState, useRef } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SubmitButton } from '@/components/ui/submit-button';
import { Save } from 'lucide-react';
import { toast } from 'sonner';

export function ChangePasswordForm() {
  const formRef = useRef<HTMLFormElement>(null);

  const [, formAction] = useActionState(async (_prev: null, formData: FormData) => {
    const newPassword = formData.get('newPassword') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (newPassword.length < 6) {
      toast.error('Wachtwoord moet minstens 6 tekens bevatten');
      return null;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Wachtwoorden komen niet overeen');
      return null;
    }

    const supabase = createBrowserClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Wachtwoord gewijzigd');
      formRef.current?.reset();
    }
    return null;
  }, null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Wachtwoord wijzigen</CardTitle>
      </CardHeader>
      <form action={formAction} ref={formRef}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newPassword">Nieuw wachtwoord</Label>
            <Input
              id="newPassword"
              name="newPassword"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Bevestig wachtwoord</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>
          <SubmitButton icon={<Save />}>
            Wachtwoord opslaan
          </SubmitButton>
        </CardContent>
      </form>
    </Card>
  );
}
