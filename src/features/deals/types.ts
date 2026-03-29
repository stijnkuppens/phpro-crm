import { z } from 'zod';
import type { Database } from '@/types/database';

export const entityIdSchema = z.string().min(1);

export type Deal = Database['public']['Tables']['deals']['Row'];

export type DealWithRelations = Deal & {
  account: { id: string; name: string } | null;
  contact: { id: string; first_name: string; last_name: string; title: string | null } | null;
  owner: { id: string; full_name: string | null } | null;
  stage: { id: string; name: string; color: string; probability: number; is_closed: boolean; is_won: boolean; is_longterm: boolean } | null;
  pipeline: { id: string; name: string; type: string } | null;
};

export type DealCard = {
  id: string;
  title: string;
  amount: number;
  probability: number;
  close_date: string | null;
  account_name: string;
  owner_name: string | null;
  stage_id: string;
  forecast_category: string | null;
  origin: string | null;
  lead_source: string | null;
};

export const dealFormSchema = z.object({
  title: z.string().min(1, 'Titel is verplicht'),
  account_id: z.string().min(1, 'Account is verplicht'),
  pipeline_id: z.string().min(1, 'Pipeline is verplicht'),
  stage_id: z.string().min(1, 'Stage is verplicht'),
  amount: z.coerce.number().min(0).optional(),
  close_date: z.string().optional().nullable(),
  probability: z.coerce.number().min(0).max(100).optional(),
  owner_id: z.string().optional().nullable(),
  description: z.string().optional(),
  contact_id: z.string().optional().nullable(),
  lead_source: z.string().optional(),
  origin: z.enum(['rechtstreeks', 'cronos']).optional(),
  cronos_cc: z.string().optional(),
  cronos_contact: z.string().optional(),
  cronos_email: z.string().optional(),
  consultant_id: z.string().optional().nullable(),
  consultant_role: z.string().optional(),
  forecast_category: z.enum(['Commit', 'Best Case', 'Pipeline', 'Omit']).optional().nullable(),
  tags: z.array(z.string()).optional(),
  tarief_gewenst: z.coerce.number().min(0).optional().nullable(),
  tarief_aangeboden: z.coerce.number().min(0).optional().nullable(),
});

export type DealFormValues = z.infer<typeof dealFormSchema>;

export const closeDealSchema = z.object({
  closed_type: z.enum(['won', 'lost', 'longterm']),
  closed_reason: z.string().optional(),
  closed_notes: z.string().optional(),
  longterm_date: z.string().optional().nullable(),
}).refine(
  (data) => data.closed_type !== 'longterm' || !!data.longterm_date,
  { message: 'Follow-up datum is verplicht voor longterm deals', path: ['longterm_date'] }
);

export type CloseDealValues = z.infer<typeof closeDealSchema>;

export type DealFilters = {
  account_id?: string;
  pipeline_id?: string;
  search?: string;
  owner_id?: string;
  forecast_category?: string;
  origin?: string;
  is_closed?: boolean;
};

export type Pipeline = {
  id: string;
  name: string;
  type: string;
  stages: {
    id: string;
    name: string;
    color: string;
    sort_order: number;
    is_closed: boolean;
    is_won: boolean;
    is_longterm: boolean;
    probability: number;
  }[];
};
