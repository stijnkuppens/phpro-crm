import type { Role, Permission } from '@/types/acl';

export { roles } from '@/types/acl';
export type { Role, Permission } from '@/types/acl';

const rolePermissions: Record<Role, Permission[] | 'all'> = {
  admin: 'all',

  sales_manager: [
    'dashboard.read',
    'accounts.read', 'accounts.write', 'accounts.delete',
    'contacts.read', 'contacts.write', 'contacts.delete',
    'deals.read', 'deals.write', 'deals.delete',
    'activities.read', 'activities.write', 'activities.delete',
    'tasks.read', 'tasks.write', 'tasks.delete',
    'communications.read', 'communications.write',
    'consultants.read', 'consultants.write',
    'bench.read', 'bench.write',
    'contracts.read', 'contracts.write',
    'indexation.read', 'indexation.write', 'indexation.approve',
    'users.read',
    'settings.read',
    'audit.read',
    'notifications.read',
    'notifications.write',
    'jobs.read',
  ],

  sales_rep: [
    'dashboard.read',
    'accounts.read', 'accounts.write',
    'contacts.read', 'contacts.write',
    'deals.read', 'deals.write',
    'activities.read', 'activities.write',
    'tasks.read', 'tasks.write',
    'communications.read', 'communications.write',
    'consultants.read',
    'bench.read',
    'contracts.read',
    'indexation.read',
    'notifications.read',
    'jobs.read',
  ],

  customer_success: [
    'dashboard.read',
    'accounts.read',
    'contacts.read',
    'deals.read',
    'activities.read', 'activities.write',
    'tasks.read', 'tasks.write',
    'communications.read', 'communications.write',
    'consultants.read',
    'bench.read',
    'contracts.read',
    'notifications.read',
    'jobs.read',
  ],

  marketing: [
    'dashboard.read',
    'accounts.read',
    'contacts.read',
    'deals.read',
    'activities.read',
    'tasks.read',
    'communications.read',
    'notifications.read',
    'jobs.read',
  ],
};

export function can(role: Role, permission: Permission): boolean {
  const perms = rolePermissions[role];
  if (perms === 'all') return true;
  return perms.includes(permission);
}
