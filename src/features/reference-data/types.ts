import { z } from 'zod';

export const REF_TABLES = [
  { key: 'ref_competence_centers', label: 'Competence Centers' },
  { key: 'ref_cc_services', label: 'CC Services' },
  { key: 'ref_consultant_roles', label: 'Consultant Roles' },
  { key: 'ref_technologies', label: 'Technologies' },
  { key: 'ref_hosting_providers', label: 'Hosting Providers' },
  { key: 'ref_hosting_environments', label: 'Hosting Environments' },
  { key: 'ref_languages', label: 'Languages' },
  { key: 'ref_language_levels', label: 'Language Levels' },
  { key: 'ref_contact_roles', label: 'Contact Roles' },
  { key: 'ref_hobbies', label: 'Hobbies' },
  { key: 'ref_sla_tools', label: 'SLA Tools' },
  { key: 'ref_collaboration_types', label: 'Collaboration Types' },
  { key: 'ref_stop_reasons', label: 'Stop Reasons' },
  { key: 'ref_lead_sources', label: 'Lead Sources' },
  { key: 'ref_distribution_types', label: 'Distribution Types' },
  { key: 'ref_internal_people', label: 'Internal People' },
  { key: 'ref_teams', label: 'Teams' },
] as const;

export type RefTableKey = (typeof REF_TABLES)[number]['key'];

export type ReferenceItem = {
  id: string;
  name: string;
  sort_order: number;
  is_active: boolean;
  avatar_url?: string | null;
  created_at: string;
  updated_at: string;
};

export const refItemSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  sort_order: z.coerce.number().int().default(0),
  is_active: z.boolean().default(true),
});

export type RefItemFormValues = z.infer<typeof refItemSchema>;
