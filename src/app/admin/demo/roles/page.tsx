'use client';

import { useAuth } from '@/lib/hooks/use-auth';
import { can, roles, type Permission } from '@/lib/acl';
import { RoleGuard } from '@/components/admin/role-guard';
import { PageHeader } from '@/components/admin/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Check, X } from 'lucide-react';

const allPermissions: Permission[] = [
  'dashboard.read',
  'contacts.read', 'contacts.write', 'contacts.delete',
  'files.read', 'files.write', 'files.delete',
  'users.read', 'users.write',
  'settings.read', 'settings.write',
  'audit.read',
  'notifications.read',
  'demo.read',
];

export default function RoleDemoPage() {
  const { user, role, loading } = useAuth();

  if (loading) return <Skeleton className="h-96 w-full" />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Role-Based UI Demo"
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Demo' },
          { label: 'Roles' },
        ]}
      />

      <Card>
        <CardHeader>
          <CardTitle>Current User</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <div>
            <p className="font-medium">{user?.email}</p>
            <Badge variant={role === 'admin' ? 'default' : 'secondary'}>{role}</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Permission Matrix</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Permission</TableHead>
                {roles.map((r) => (
                  <TableHead key={r} className="text-center">
                    <Badge variant={r === role ? 'default' : 'outline'}>{r}</Badge>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {allPermissions.map((perm) => (
                <TableRow key={perm}>
                  <TableCell className="font-mono text-sm">{perm}</TableCell>
                  {roles.map((r) => (
                    <TableCell key={r} className="text-center">
                      {can(r, perm) ? (
                        <Check className="mx-auto h-4 w-4 text-green-600" />
                      ) : (
                        <X className="mx-auto h-4 w-4 text-muted-foreground" />
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Viewer Section</CardTitle></CardHeader>
          <CardContent>
            <RoleGuard permission="contacts.read">
              <p className="text-sm text-green-600">You can view contacts.</p>
            </RoleGuard>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Editor Section</CardTitle></CardHeader>
          <CardContent>
            <RoleGuard
              permission="contacts.write"
              fallback={<p className="text-sm text-muted-foreground">Requires editor access</p>}
            >
              <p className="text-sm text-green-600">You can create and edit contacts.</p>
              <Button size="sm" className="mt-2">Create Contact</Button>
            </RoleGuard>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Admin Section</CardTitle></CardHeader>
          <CardContent>
            <RoleGuard
              permission="users.write"
              fallback={<p className="text-sm text-muted-foreground">Requires admin access</p>}
            >
              <p className="text-sm text-green-600">You can manage users.</p>
              <Button size="sm" className="mt-2">Manage Users</Button>
              <Button size="sm" variant="destructive" className="mt-2 ml-2">Delete User</Button>
            </RoleGuard>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
