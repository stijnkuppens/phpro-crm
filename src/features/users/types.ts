import { z } from 'zod';
import { roles } from '@/types/acl';

export type { UserWithRole } from '@/types/acl';

export const updateRoleSchema = z.object({
  userId: z.string().min(1),
  newRole: z.enum(roles),
});

export const updateUserSchema = z.object({
  full_name: z.string().min(1, 'Naam is verplicht'),
  role: z.enum(roles),
});

export type UpdateUserValues = z.infer<typeof updateUserSchema>;
