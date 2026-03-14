'use client';

import { useState, useTransition } from 'react';
import { updateUserRole } from '@/features/users/actions/update-user-role';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { useAuth } from '@/lib/hooks/use-auth';
import { roles } from '@/lib/acl';
import type { Role } from '@/types/acl';
import type { Database } from '@/types/database';

type Profile = Database['public']['Tables']['user_profiles']['Row'];

type Props = {
  profile: Profile;
};

export function UserDetail({ profile: initialProfile }: Props) {
  const { role: currentRole } = useAuth();
  const [profile, setProfile] = useState(initialProfile);
  const [isPending, startTransition] = useTransition();

  const handleRoleChange = (newRole: string | null) => {
    if (!newRole || !(roles as readonly string[]).includes(newRole)) return;
    const role = newRole as Role;
    startTransition(async () => {
      const result = await updateUserRole(profile.id, role);
      if (result.error) {
        toast.error(typeof result.error === 'string' ? result.error : 'Failed to update role');
      } else {
        toast.success('Role updated');
        setProfile((prev) => ({ ...prev, role }));
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Name</p>
          <p>{profile.full_name || '—'}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Role</p>
          {currentRole === 'admin' ? (
            <Select value={profile.role} onValueChange={handleRoleChange} disabled={isPending}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {roles.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Badge>{profile.role}</Badge>
          )}
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Member since</p>
          <p>{new Date(profile.created_at).toLocaleDateString()}</p>
        </div>
      </CardContent>
    </Card>
  );
}
