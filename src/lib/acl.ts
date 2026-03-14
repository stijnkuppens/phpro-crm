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
    'activities.read', 'activities.write',
    'tasks.read', 'tasks.write',
    'communications.read', 'communications.write',
    'consultants.read', 'consultants.write',
    'bench.read', 'bench.write',
    'contracts.read', 'contracts.write',
    'indexation.read', 'indexation.write', 'indexation.approve',
    'revenue.read', 'revenue.write',
    'pipeline.read', 'prognose.read',
    'files.read', 'files.write',
    'users.read',
    'settings.read',
    'audit.read',
    'notifications.read',
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
    'revenue.read',
    'pipeline.read', 'prognose.read',
    'files.read',
    'notifications.read',
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
    'revenue.read',
    'pipeline.read', 'prognose.read',
    'files.read',
    'notifications.read',
  ],

  marketing: [
    'dashboard.read',
    'accounts.read',
    'contacts.read',
    'deals.read',
    'activities.read',
    'tasks.read',
    'communications.read',
    'pipeline.read',
    'files.read',
    'notifications.read',
  ],
};

export function can(role: Role, permission: Permission): boolean {
  const perms = rolePermissions[role];
  if (perms === 'all') return true;
  return perms.includes(permission);
}
