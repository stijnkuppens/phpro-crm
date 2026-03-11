import type { Role, Permission } from '@/types/acl';

export { roles } from '@/types/acl';
export type { Role, Permission } from '@/types/acl';

const rolePermissions: Record<Role, Permission[] | 'all'> = {
  admin: 'all',
  editor: [
    'dashboard.read',
    'contacts.read',
    'contacts.write',
    'files.read',
    'files.write',
    'demo.read',
  ],
  viewer: [
    'dashboard.read',
    'contacts.read',
    'files.read',
    'demo.read',
  ],
};

export function can(role: Role, permission: Permission): boolean {
  const perms = rolePermissions[role];
  if (perms === 'all') return true;
  return perms.includes(permission);
}
