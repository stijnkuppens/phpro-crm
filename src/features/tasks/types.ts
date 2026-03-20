import { z } from 'zod';
import type { Database } from '@/types/database';

export type Task = Database['public']['Tables']['tasks']['Row'];

export type TaskWithRelations = Task & {
  account: { id: string; name: string } | null;
  deal: { id: string; title: string } | null;
  assignee: { id: string; full_name: string | null } | null;
};

export const taskFormSchema = z.object({
  title: z.string().min(1, 'Titel is verplicht'),
  due_date: z.string().optional().nullable(),
  priority: z.enum(['High', 'Medium', 'Low']),
  status: z.enum(['Open', 'In Progress', 'Done']),
  account_id: z.string().uuid().optional().nullable(),
  deal_id: z.string().uuid().optional().nullable(),
  assigned_to: z.string().uuid().optional().nullable(),
});

export type TaskFormValues = z.infer<typeof taskFormSchema>;

export type TaskFilters = {
  status?: string;
  priority?: string;
  assigned_to?: string;
  deal_id?: string;
};
