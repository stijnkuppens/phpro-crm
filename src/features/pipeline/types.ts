import { z } from 'zod';
import type { Database } from '@/types/database';

export type PipelineEntry = Database['public']['Tables']['pipeline_entries']['Row'];

export type PipelineEntryWithDivision = PipelineEntry & {
  division: { id: string; name: string; color: string } | null;
};

export const pipelineEntryFormSchema = z.object({
  client: z.string().min(1, 'Client is verplicht'),
  division_id: z.string().uuid('Division is verplicht'),
  service_name: z.string().min(1, 'Service is verplicht'),
  sold_month: z.coerce.number().min(0).max(11),
  start_month: z.coerce.number().min(0).max(11),
  duration: z.coerce.number().min(1),
  total: z.coerce.number().min(0),
  year: z.coerce.number(),
  deal_id: z.string().uuid().optional().nullable(),
});

export type PipelineEntryFormValues = z.infer<typeof pipelineEntryFormSchema>;
