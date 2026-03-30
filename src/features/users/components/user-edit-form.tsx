'use client';

import { Save } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useActionState, useState } from 'react';
import { toast } from 'sonner';
import { AvatarUpload } from '@/components/admin/avatar-upload';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { SubmitButton } from '@/components/ui/submit-button';
import { roles } from '@/types/acl';
import { updateUser } from '../actions/update-user';
import { updateUserAvatar } from '../actions/update-user-avatar';
import type { UserDetail } from '../queries/get-user';

function getInitials(name: string): string {
  return (
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase() || '?'
  );
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  sales_manager: 'Sales Manager',
  sales_rep: 'Sales Rep',
  customer_success: 'Customer Success',
  marketing: 'Marketing',
};

type Props = {
  user: UserDetail;
};

export function UserEditForm({ user }: Props) {
  const router = useRouter();
  const [role, setRole] = useState(user.role);

  const [, formAction] = useActionState(async (_prev: null, formData: FormData) => {
    const result = await updateUser(user.id, {
      full_name: formData.get('full_name') as string,
      role: role as (typeof roles)[number],
    });

    if (result.error) {
      toast.error(typeof result.error === 'string' ? result.error : 'Validatiefout');
      return null;
    }

    toast.success('Gebruiker bijgewerkt');
    router.push(`/admin/users/${user.id}`);
    return null;
  }, null);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold">Gebruiker bewerken</CardTitle>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <AvatarUpload
              currentPath={user.avatar_url || null}
              fallback={getInitials(user.full_name)}
              storagePath={`users/${user.id}`}
              size="lg"
              round
              onUploaded={async (path) => {
                const result = await updateUserAvatar(user.id, path);
                if (result.error) {
                  toast.error(typeof result.error === 'string' ? result.error : 'Upload mislukt');
                }
              }}
            />
            <p className="text-sm text-muted-foreground">Klik om foto te wijzigen</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="full_name">Naam</Label>
            <Input id="full_name" name="full_name" defaultValue={user.full_name} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" value={user.email} disabled className="bg-muted" />
            <p className="text-xs text-muted-foreground">E-mailadres kan niet gewijzigd worden.</p>
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

          <SubmitButton icon={<Save />}>Opslaan</SubmitButton>
        </CardContent>
      </form>
    </Card>
  );
}
