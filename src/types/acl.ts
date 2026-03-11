export const roles = ['admin', 'editor', 'viewer'] as const;
export type Role = (typeof roles)[number];

export type Permission =
  | 'dashboard.read'
  | 'contacts.read'
  | 'contacts.write'
  | 'contacts.delete'
  | 'files.read'
  | 'files.write'
  | 'files.delete'
  | 'users.read'
  | 'users.write'
  | 'settings.read'
  | 'settings.write'
  | 'demo.read';

export type UserWithRole = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: Role;
};
