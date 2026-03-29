import { z } from 'zod';
import type { Database } from '@/types/database';

export const entityIdSchema = z.string().min(1);

export type Activity = Database['public']['Tables']['activities']['Row'];

export type ActivityWithRelations = Activity & {
  // Fields added by migration 00020 (not yet in generated types)
  priority?: string | null;
  assigned_to?: string | null;
  // Joined relations
  account: { id: string; name: string } | null;
  deal: { id: string; title: string } | null;
  owner: { id: string; full_name: string | null } | null;
  assignee: { id: string; full_name: string | null } | null;
};

export const ACTIVITY_TYPES = ['Meeting', 'Demo', 'Call', 'E-mail', 'Lunch', 'Event', 'Taak'] as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export const activityFormSchema = z.object({
  type: z.enum(ACTIVITY_TYPES),
  subject: z.string().min(1, 'Onderwerp is verplicht'),
  date: z.string().min(1, 'Datum is verplicht'),
  duration_minutes: z.coerce.number().optional().nullable(),
  account_id: z.string().min(1, 'Account is verplicht'),
  deal_id: z.string().optional().nullable(),
  notes: z.unknown().optional().nullable(),
  is_done: z.boolean().optional(),
  priority: z.enum(['High', 'Medium', 'Low']).optional().nullable(),
  assigned_to: z.string().optional().nullable(),
});

export type ActivityFormValues = z.infer<typeof activityFormSchema>;

export type ActivityFilters = {
  search?: string;
  type?: string;
  account_id?: string;
  is_done?: boolean;
  deal_id?: string;
};
