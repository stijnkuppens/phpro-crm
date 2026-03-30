'use client';

import { Send } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useActionState, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { SubmitButton } from '@/components/ui/submit-button';
import { roles } from '@/types/acl';
import { inviteUser } from '../actions/invite-user';

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  sales_manager: 'Sales Manager',
  sales_rep: 'Sales Rep',
  customer_success: 'Customer Success',
  marketing: 'Marketing',
};

export function InviteForm() {
  const router = useRouter();
  const [role, setRole] = useState('sales_rep');

  const [, formAction] = useActionState(async (_prev: null, formData: FormData) => {
    const email = formData.get('email') as string;
    const fullName = formData.get('fullName') as string;

    const result = await inviteUser({
      email,
      fullName,
      role: role as (typeof roles)[number],
    });
    if (result.error) {
      toast.error(typeof result.error === 'string' ? result.error : 'Uitnodiging mislukt');
      return null;
    }
    toast.success(`Uitnodiging verstuurd naar ${email}`);
    router.push('/admin/users');
    return null;
  }, null);

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="fullName">Naam</Label>
        <Input id="fullName" name="fullName" placeholder="Jan Janssens" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">E-mailadres</Label>
        <Input id="email" name="email" type="email" placeholder="jan@phpro.be" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="role">Rol</Label>
        <Select value={role} onValueChange={(v) => v && setRole(v)}>
          <SelectTrigger id="role">{ROLE_LABELS[role] ?? 'Selecteer rol...'}</SelectTrigger>
          <SelectContent>
            {roles.map((r) => (
              <SelectItem key={r} value={r}>
                {ROLE_LABELS[r] ?? r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-3 pt-2">
        <SubmitButton icon={<Send />}>Uitnodiging versturen</SubmitButton>
        <Button type="button" variant="outline" onClick={() => router.push('/admin/users')}>
          Annuleren
        </Button>
      </div>
    </form>
  );
}
