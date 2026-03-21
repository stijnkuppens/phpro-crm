import { z } from 'zod';
import type { Database } from '@/types/database';

// ---------------------------------------------------------------------------
// Database row types
// ---------------------------------------------------------------------------

export type Consultant = Database['public']['Tables']['consultants']['Row'];
export type ConsultantLanguage = Database['public']['Tables']['consultant_languages']['Row'];
export type ConsultantRateHistory = Database['public']['Tables']['consultant_rate_history']['Row'];
export type ConsultantExtension = Database['public']['Tables']['consultant_extensions']['Row'];
export type ConsultantContractAttribution = Database['public']['Tables']['consultant_contract_attributions']['Row'];

export type ConsultantStatus = Consultant['status']; // 'bench' | 'actief' | 'stopgezet'

// ---------------------------------------------------------------------------
// Composite types (with joined relations)
// ---------------------------------------------------------------------------

/** Supabase select string for consultants with all relations */
export const CONSULTANT_SELECT =
  '*, account:accounts(id, name), languages:consultant_languages(*), rate_history:consultant_rate_history(*), extensions:consultant_extensions(*), contract_attribution:consultant_contract_attributions(*)';

export type ConsultantWithDetails = Consultant & {
  account: { id: string; name: string } | null;
  languages: ConsultantLanguage[];
  rate_history: ConsultantRateHistory[];
  extensions: ConsultantExtension[];
  contract_attribution: ConsultantContractAttribution | null;
};

// ---------------------------------------------------------------------------
// Contract status helpers
// ---------------------------------------------------------------------------

export type ContractStatus = 'stopgezet' | 'onbepaald' | 'verlopen' | 'kritiek' | 'waarschuwing' | 'actief';

export const contractStatusColors: Record<ContractStatus, string> = {
  actief: 'bg-green-100 text-green-800',
  waarschuwing: 'bg-yellow-100 text-yellow-800',
  kritiek: 'bg-red-100 text-red-800',
  verlopen: 'bg-gray-100 text-gray-800',
  onbepaald: 'bg-blue-100 text-blue-800',
  stopgezet: 'bg-gray-300 text-gray-600',
};

export function getContractStatus(consultant: Consultant): ContractStatus {
  if (consultant.status === 'stopgezet') return 'stopgezet';
  if (consultant.is_indefinite || !consultant.end_date) return 'onbepaald';
  const days = Math.ceil((new Date(consultant.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (days < 0) return 'verlopen';
  if (days <= 60) return 'kritiek';
  if (days <= 120) return 'waarschuwing';
  return 'actief';
}

export function getCurrentRate(consultant: ConsultantWithDetails): number {
  if (!consultant.rate_history || consultant.rate_history.length === 0) {
    return Number(consultant.hourly_rate ?? 0);
  }
  const now = new Date();
  const pastRates = consultant.rate_history.filter(
    (r) => new Date(r.date) <= now,
  );
  if (pastRates.length === 0) {
    return Number(consultant.hourly_rate ?? 0);
  }
  const sorted = [...pastRates].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
  return Number(sorted[0].rate);
}

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------

/** Schema for creating/editing a bench consultant */
export const benchConsultantFormSchema = z.object({
  first_name: z.string().min(1, 'Voornaam is verplicht'),
  last_name: z.string().min(1, 'Achternaam is verplicht'),
  city: z.string().optional(),
  priority: z.enum(['High', 'Medium', 'Low']),
  available_date: z.string().optional().nullable(),
  min_hourly_rate: z.coerce.number().optional().nullable(),
  max_hourly_rate: z.coerce.number().optional().nullable(),
  roles: z.array(z.string()).optional(),
  technologies: z.array(z.string()).optional(),
  description: z.string().optional(),
  cv_pdf_url: z.string().optional().nullable(),
});

export type BenchConsultantFormValues = z.infer<typeof benchConsultantFormSchema>;

/** Schema for editing an active consultant */
export const consultantFormSchema = z.object({
  account_id: z.string().optional().nullable(),
  first_name: z.string().min(1, 'Voornaam is verplicht'),
  last_name: z.string().min(1, 'Achternaam is verplicht'),
  role: z.string().optional(),
  city: z.string().optional(),
  cv_pdf_url: z.string().optional().nullable(),
  client_name: z.string().optional(),
  client_city: z.string().optional(),
  start_date: z.string().min(1, 'Startdatum is verplicht'),
  end_date: z.string().optional().nullable(),
  is_indefinite: z.boolean().optional(),
  hourly_rate: z.coerce.number().min(0, 'Uurtarief is verplicht'),
  sow_url: z.string().optional(),
  notice_period_days: z.coerce.number().optional(),
  notes: z.string().optional(),
});

export type ConsultantFormValues = z.infer<typeof consultantFormSchema>;

/** Schema for adding/editing a language */
export const languageFormSchema = z.object({
  language: z.string().min(1),
  level: z.enum(['Basis', 'Gevorderd', 'Vloeiend', 'Moedertaal']),
});

export type LanguageFormValues = z.infer<typeof languageFormSchema>;
