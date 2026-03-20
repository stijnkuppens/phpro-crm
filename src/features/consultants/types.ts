import { z } from 'zod';
import type { Database } from '@/types/database';

export type ActiveConsultant = Database['public']['Tables']['active_consultants']['Row'];
export type ConsultantRateHistory = Database['public']['Tables']['consultant_rate_history']['Row'];
export type ConsultantExtension = Database['public']['Tables']['consultant_extensions']['Row'];
export type ConsultantContractAttribution = Database['public']['Tables']['consultant_contract_attributions']['Row'];

export type ActiveConsultantWithDetails = ActiveConsultant & {
  account: { id: string; name: string } | null;
  rate_history: ConsultantRateHistory[];
  extensions: ConsultantExtension[];
  contract_attribution: ConsultantContractAttribution | null;
};

export type ContractStatus = 'stopgezet' | 'onbepaald' | 'verlopen' | 'kritiek' | 'waarschuwing' | 'actief';

export function getContractStatus(consultant: ActiveConsultant): ContractStatus {
  if (consultant.is_stopped) return 'stopgezet';
  if (consultant.is_indefinite || !consultant.end_date) return 'onbepaald';
  const days = Math.ceil((new Date(consultant.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (days < 0) return 'verlopen';
  if (days <= 60) return 'kritiek';
  if (days <= 120) return 'waarschuwing';
  return 'actief';
}

export function getCurrentRate(consultant: ActiveConsultantWithDetails): number {
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

export const activeConsultantFormSchema = z.object({
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

export type ActiveConsultantFormValues = z.infer<typeof activeConsultantFormSchema>;
