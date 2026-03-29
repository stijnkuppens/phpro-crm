import { z } from 'zod';
import type { Database } from '@/types/database';
import { Mail, FileText, Users, Phone } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export const entityIdSchema = z.string().min(1);

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
  content: z.unknown().optional().nullable(), // Plate JSON
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

// ── Shared type config ─────────────────────────────────────────────────────
export const COMMUNICATION_TYPE_CONFIG: Record<string, { icon: LucideIcon; bg: string; color: string; label: string }> = {
  email: { icon: Mail, bg: 'bg-blue-50 dark:bg-blue-950', color: 'text-blue-600 dark:text-blue-400', label: 'E-mail' },
  note: { icon: FileText, bg: 'bg-amber-50 dark:bg-amber-950', color: 'text-amber-600 dark:text-amber-400', label: 'Notitie' },
  meeting: { icon: Users, bg: 'bg-green-50 dark:bg-green-950', color: 'text-green-600 dark:text-green-400', label: 'Vergadering' },
  call: { icon: Phone, bg: 'bg-purple-50 dark:bg-purple-950', color: 'text-purple-600 dark:text-purple-400', label: 'Call' },
};
