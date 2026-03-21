import { z } from 'zod';
import type { Database } from '@/types/database';

// ── Row types from database ─────────────────────────────────────────────────
export type Account = Database['public']['Tables']['accounts']['Row'];
export type AccountManualService = Database['public']['Tables']['account_manual_services']['Row'];

// ── FK-joined relation types (from Supabase nested selects) ─────────────────
export type AccountTechStackWithRef = {
  id: string;
  technology: { id: string; name: string };
};

export type AccountSamenwerkingsvormWithRef = {
  id: string;
  collaboration_type: { id: string; name: string };
};

export type AccountHostingWithRef = {
  id: string;
  provider: { id: string; name: string };
  environment: { id: string; name: string } | null;
  url: string | null;
  notes: string | null;
};

export type AccountCompetenceCenterWithRef = {
  id: string;
  cc: { id: string; name: string };
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  distribution: string | null;
  cc_services: { service_id: string }[];
};

export type AccountServiceWithRef = {
  id: string;
  service: { id: string; name: string };
};

// ── Extended account with relations ─────────────────────────────────────────
export type AccountWithRelations = Account & {
  logo_url?: string | null; // TODO: remove after types:generate
  manual_services: AccountManualService[];
  tech_stacks: AccountTechStackWithRef[];
  samenwerkingsvormen: AccountSamenwerkingsvormWithRef[];
  hosting: AccountHostingWithRef[];
  competence_centers: AccountCompetenceCenterWithRef[];
  services: AccountServiceWithRef[];
  owner: { id: string; full_name: string | null } | null;
};

// ── Reference data type (passed as props to form) ───────────────────────────
export type ReferenceOption = { id: string; name: string; avatar_url?: string | null };

export type AccountReferenceData = {
  technologies: ReferenceOption[];
  collaborationTypes: ReferenceOption[];
  hostingProviders: ReferenceOption[];
  hostingEnvironments: ReferenceOption[];
  competenceCenters: ReferenceOption[];
  ccServices: ReferenceOption[];
  internalPeople: ReferenceOption[];
  teams: ReferenceOption[];
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
  owner_id: z.string().optional().nullable(),
  managing_partner: z.string().optional(),
  account_director: z.string().optional(),
  project_manager: z.string().optional(),
  team: z.string().optional(),
  about: z.string().optional(),
  phpro_contract: z.enum(['Geen', 'Actief', 'Inactief', 'In onderhandeling']).optional(),
});

export type AccountFormValues = z.infer<typeof accountFormSchema>;

export const hostingFormSchema = z.object({
  provider_id: z.string().min(1, 'Provider is verplicht'),
  environment_id: z.string().optional().nullable(),
  url: z.string().optional(),
  notes: z.string().optional(),
});

export type HostingFormValues = z.infer<typeof hostingFormSchema>;

export const competenceCenterFormSchema = z.object({
  competence_center_id: z.string().min(1, 'Naam is verplicht'),
  contact_person: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  distribution: z.enum(['4%', '50/50']).optional(),
  service_ids: z.array(z.string()).optional(),
});

export type CompetenceCenterFormValues = z.infer<typeof competenceCenterFormSchema>;

// ── List display type ──────────────────────────────────────────────────────
export type AccountListItem = {
  id: string;
  name: string;
  domain: string | null;
  logo_url?: string | null; // TODO: remove after types:generate
  type: 'Klant' | 'Prospect' | 'Partner';
  status: 'Actief' | 'Inactief';
  owner: { id: string; full_name: string | null } | null;
  has_framework_contract: boolean;
  has_service_contract: boolean;
  active_consultant_count: number;
};

// ── Filter types ────────────────────────────────────────────────────────────
export type AccountFilters = {
  search?: string;
  type?: string;
  status?: string;
  owner_id?: string;
  country?: string;
};
