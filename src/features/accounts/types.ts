import { z } from 'zod';
import type { Database } from '@/types/database';

// ── Row types from database ─────────────────────────────────────────────────
export type Account = Database['public']['Tables']['accounts']['Row'];
export type AccountManualService = Database['public']['Tables']['account_manual_services']['Row'];
export type AccountTechStack = Database['public']['Tables']['account_tech_stacks']['Row'];
export type AccountSamenwerkingsvorm = Database['public']['Tables']['account_samenwerkingsvormen']['Row'];
export type AccountHosting = Database['public']['Tables']['account_hosting']['Row'];
export type AccountCompetenceCenter = Database['public']['Tables']['account_competence_centers']['Row'];
export type AccountService = Database['public']['Tables']['account_services']['Row'];

// ── Extended account with relations ─────────────────────────────────────────
export type AccountWithRelations = Account & {
  manual_services: AccountManualService[];
  tech_stacks: AccountTechStack[];
  samenwerkingsvormen: AccountSamenwerkingsvorm[];
  hosting: AccountHosting[];
  competence_centers: AccountCompetenceCenter[];
  services: AccountService[];
  owner: { id: string; full_name: string | null } | null;
};

// ── Zod schemas for form validation ─────────────────────────────────────────
export const accountFormSchema = z.object({
  name: z.string().min(1, 'Naam is verplicht'),
  domain: z.string().optional(),
  type: z.enum(['Klant', 'Prospect', 'Partner']),
  status: z.enum(['Actief', 'Inactief']),
  industry: z.string().optional(),
  size: z.string().optional(),
  revenue: z.coerce.number().optional(),
  phone: z.string().optional(),
  website: z.string().optional(),
  address: z.string().optional(),
  country: z.string().optional(),
  vat_number: z.string().optional(),
  owner_id: z.string().uuid().optional().nullable(),
  health: z.coerce.number().min(0).max(100).optional(),
  managing_partner: z.string().optional(),
  account_director: z.string().optional(),
  team: z.string().optional(),
  about: z.string().optional(),
  phpro_contract: z.enum(['Geen', 'Actief', 'Inactief', 'In onderhandeling']).optional(),
});

export type AccountFormValues = z.infer<typeof accountFormSchema>;

export const hostingFormSchema = z.object({
  provider: z.string().min(1, 'Provider is verplicht'),
  environment: z.string().optional(),
  url: z.string().optional(),
  notes: z.string().optional(),
});

export type HostingFormValues = z.infer<typeof hostingFormSchema>;

export const competenceCenterFormSchema = z.object({
  cc_name: z.string().min(1, 'Naam is verplicht'),
  contact_person: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  distribution: z.enum(['4%', '50/50']).optional(),
  services: z.array(z.string()).optional(),
});

export type CompetenceCenterFormValues = z.infer<typeof competenceCenterFormSchema>;

// ── Filter types ────────────────────────────────────────────────────────────
export type AccountFilters = {
  search?: string;
  type?: string;
  status?: string;
  owner_id?: string;
  country?: string;
};
