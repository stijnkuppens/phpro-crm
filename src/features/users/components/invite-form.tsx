'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, Send } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';
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
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('sales_rep');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const result = await inviteUser({ email, fullName, role: role as typeof roles[number] });
      if (result.error) {
        toast.error(typeof result.error === 'string' ? result.error : 'Uitnodiging mislukt');
        return;
      }
      toast.success(`Uitnodiging verstuurd naar ${email}`);
      router.push('/admin/users');
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="fullName">Naam</Label>
        <Input
          id="fullName"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Jan Janssens"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">E-mailadres</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="jan@phpro.be"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="role">Rol</Label>
        <Select value={role} onValueChange={(v) => v && setRole(v)}>
          <SelectTrigger id="role">
            {ROLE_LABELS[role] ?? 'Selecteer rol...'}
          </SelectTrigger>
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
        <Button type="submit" disabled={isPending}>
          {isPending ? <Loader2 className="animate-spin" /> : <Send />}
          Uitnodiging versturen
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/admin/users')}
          disabled={isPending}
        >
          Annuleren
        </Button>
      </div>
    </form>
  );
}
