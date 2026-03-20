import { z } from 'zod';
import type { Database } from '@/types/database';

export type Activity = Database['public']['Tables']['activities']['Row'];

export type ActivityWithRelations = Activity & {
  account: { id: string; name: string } | null;
  deal: { id: string; title: string } | null;
  owner: { id: string; full_name: string | null } | null;
};

export const activityFormSchema = z.object({
  type: z.enum(['Meeting', 'Demo', 'Call', 'E-mail', 'Lunch', 'Event']),
  subject: z.string().min(1, 'Onderwerp is verplicht'),
  date: z.string().min(1, 'Datum is verplicht'),
  duration_minutes: z.coerce.number().optional().nullable(),
  account_id: z.string().uuid('Account is verplicht'),
  deal_id: z.string().uuid().optional().nullable(),
  notes: z.any().optional().nullable(),
  is_done: z.boolean().optional(),
});

export type ActivityFormValues = z.infer<typeof activityFormSchema>;

export type ActivityFilters = {
  search?: string;
  type?: string;
  account_id?: string;
  is_done?: boolean;
  deal_id?: string;
};
