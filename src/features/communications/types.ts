import { z } from 'zod';
import type { Database } from '@/types/database';

// ── Row types ───────────────────────────────────────────────────────────────
export type Communication = Database['public']['Tables']['communications']['Row'];

// ── Extended type ───────────────────────────────────────────────────────────
export type CommunicationWithDetails = Communication & {
  contact: { id: string; first_name: string; last_name: string } | null;
  deal: { id: string; title: string } | null;
  owner: { id: string; full_name: string | null } | null;
};

// ── Zod schema ──────────────────────────────────────────────────────────────
export const communicationFormSchema = z.object({
  account_id: z.string().min(1),
  contact_id: z.string().optional().nullable(),
  deal_id: z.string().optional().nullable(),
  type: z.enum(['email', 'note', 'meeting', 'call']),
  subject: z.string().min(1, 'Onderwerp is verplicht'),
  to: z.string().optional().nullable(),
  date: z.string().min(1, 'Datum is verplicht'),
  duration_minutes: z.coerce.number().optional().nullable(),
  content: z.any().optional().nullable(), // Plate JSON
  is_done: z.boolean().optional(),
});

export type CommunicationFormValues = z.infer<typeof communicationFormSchema>;

// ── Filter types ────────────────────────────────────────────────────────────
export type CommunicationFilters = {
  account_id?: string;
  type?: string;
  contact_id?: string;
  deal_id?: string;
};
