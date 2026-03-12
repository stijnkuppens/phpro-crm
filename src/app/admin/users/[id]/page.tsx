'use client';

import { useEffect, useState, useTransition } from 'react';
import { useParams } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase/client';
import { updateUserRole } from '@/features/users/actions/update-user-role';
import { PageHeader } from '@/components/admin/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useAuth } from '@/lib/hooks/use-auth';
import { roles } from '@/lib/acl';
import type { Database } from '@/types/database';

type Profile = Database['public']['Tables']['user_profiles']['Row'];

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const supabase = createBrowserClient();
  const { role: currentRole } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', id)
        .single();
      setProfile(data);
      setLoading(false);
    }
    load();
  }, [id]);

  const handleRoleChange = (newRole: string | null) => {
    if (!newRole) return;
    startTransition(async () => {
      try {
        await updateUserRole(id, newRole);
        toast.success('Role updated');
        setProfile((prev) =>
          prev ? { ...prev, role: newRole as 'admin' | 'editor' | 'viewer' } : prev,
        );
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to update role');
      }
    });
  };

  if (loading) return <Skeleton className="h-96 w-full" />;
  if (!profile) return <p>User not found</p>;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title={profile.full_name || 'User'}
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Users', href: '/admin/users' },
          { label: profile.full_name || 'User' },
        ]}
      />
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
    </div>
  );
}
