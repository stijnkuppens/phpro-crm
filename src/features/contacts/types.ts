import { z } from 'zod';
import type { Database } from '@/types/database';

// ── Row types ───────────────────────────────────────────────────────────────
export type Contact = Database['public']['Tables']['contacts']['Row'];
export type ContactPersonalInfo = Database['public']['Tables']['contact_personal_info']['Row'];

// ── Extended type ───────────────────────────────────────────────────────────
export type ContactWithDetails = Contact & {
  avatar_url?: string | null; // TODO: remove after types:generate
  personal_info: ContactPersonalInfo | null;
  account: { id: string; name: string } | null;
};

// ── Zod schemas ─────────────────────────────────────────────────────────────
export const contactFormSchema = z.object({
  account_id: z.string().min(1, 'Account is verplicht'),
  first_name: z.string().min(1, 'Voornaam is verplicht'),
  last_name: z.string().min(1, 'Achternaam is verplicht'),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  title: z.string().optional(),
  role: z.enum([
    'Decision Maker', 'Influencer', 'Champion', 'Sponsor', 'Steerco Lid',
    'Technisch', 'Financieel', 'Operationeel', 'Contact',
  ]).optional(),
  is_steerco: z.boolean().optional(),
  is_pinned: z.boolean().optional(),
});

export type ContactFormValues = z.infer<typeof contactFormSchema>;

export const personalInfoFormSchema = z.object({
  hobbies: z.array(z.string()).optional(),
  marital_status: z.string().optional(),
  has_children: z.boolean().optional(),
  children_count: z.coerce.number().optional(),
  children_names: z.string().optional(),
  birthday: z.string().optional(),
  partner_name: z.string().optional(),
  partner_profession: z.string().optional(),
  notes: z.string().optional(),
  invite_dinner: z.boolean().optional(),
  invite_event: z.boolean().optional(),
  invite_gift: z.boolean().optional(),
});

export type PersonalInfoFormValues = z.infer<typeof personalInfoFormSchema>;

// ── Filter types ────────────────────────────────────────────────────────────
export type ContactFilters = {
  search?: string;
  account_id?: string;
  role?: string;
  is_steerco?: boolean;
};
