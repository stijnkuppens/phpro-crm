'use client';

import { useRouter } from 'next/navigation';
import { useActionState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { SubmitButton } from '@/components/ui/submit-button';
import { createBrowserClient } from '@/lib/supabase/client';

export function ResetPasswordForm() {
  const router = useRouter();

  const [, formAction] = useActionState(async (_prev: null, formData: FormData) => {
    const password = formData.get('password') as string;
    const supabase = createBrowserClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      toast.error(error.message);
      return null;
    }

    toast.success('Password updated successfully');
    router.push('/admin');
    return null;
  }, null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reset password</CardTitle>
        <CardDescription>Enter your new password</CardDescription>
      </CardHeader>
      <form action={formAction}>
        <CardContent>
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              New password
            </label>
            <Input id="password" name="password" type="password" required minLength={6} />
          </div>
        </CardContent>
        <CardFooter>
          <SubmitButton className="w-full">Update password</SubmitButton>
        </CardFooter>
      </form>
    </Card>
  );
}
