'use client';

import { useAuth } from '@/lib/hooks/use-auth';
import { can, type Permission } from '@/lib/acl';
import type { ReactNode } from 'react';

type RoleGuardProps = {
  permission: Permission;
  children: ReactNode;
  fallback?: ReactNode;
};

export function RoleGuard({ permission, children, fallback = null }: RoleGuardProps) {
  const { role, loading } = useAuth();

  if (loading) return null;
  if (!role || !can(role, permission)) return <>{fallback}</>;

  return <>{children}</>;
}
