export const roles = ['admin', 'sales_manager', 'sales_rep', 'customer_success', 'marketing'] as const;
export type Role = (typeof roles)[number];

export type Permission =
  // Dashboard
  | 'dashboard.read'
  // Accounts
  | 'accounts.read'
  | 'accounts.write'
  | 'accounts.delete'
  // Contacts
  | 'contacts.read'
  | 'contacts.write'
  | 'contacts.delete'
  // Deals
  | 'deals.read'
  | 'deals.write'
  | 'deals.delete'
  // Activities
  | 'activities.read'
  | 'activities.write'
  | 'activities.delete'
  // Tasks
  | 'tasks.read'
  | 'tasks.write'
  | 'tasks.delete'
  // Communications
  | 'communications.read'
  | 'communications.write'
  // Consultants
  | 'consultants.read'
  | 'consultants.write'
  // Bench
  | 'bench.read'
  | 'bench.write'
  // Contracts
  | 'contracts.read'
  | 'contracts.write'
  // Indexation
  | 'indexation.read'
  | 'indexation.write'
  | 'indexation.approve'
  // Users (existing)
  | 'users.read'
  | 'users.write'
  // Reference data
  | 'reference_data.write'
  // Settings (existing)
  | 'settings.read'
  | 'settings.write'
  // Audit (existing)
  | 'audit.read'
  // Notifications (existing)
  | 'notifications.read'
  | 'notifications.write'
  // Jobs
  | 'jobs.read';

export type UserWithRole = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: Role;
};
