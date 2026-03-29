import { z } from 'zod';
import type { Database } from '@/types/database';

export type Contract = Database['public']['Tables']['contracts']['Row'];
export type HourlyRate = Database['public']['Tables']['hourly_rates']['Row'];
export type SlaRate = Database['public']['Tables']['sla_rates']['Row'];
export type SlaTool = Database['public']['Tables']['sla_tools']['Row'];

export type SlaRateWithTools = SlaRate & {
  tools: SlaTool[];
};

export const contractFormSchema = z.object({
  has_framework_contract: z.boolean(),
  framework_pdf_url: z.string().optional().nullable(),
  framework_doc_path: z.string().optional().nullable(),
  framework_start: z.string().optional().nullable(),
  framework_end: z.string().optional().nullable(),
  framework_indefinite: z.boolean().optional(),
  has_service_contract: z.boolean(),
  service_pdf_url: z.string().optional().nullable(),
  service_doc_path: z.string().optional().nullable(),
  service_start: z.string().optional().nullable(),
  service_end: z.string().optional().nullable(),
  service_indefinite: z.boolean().optional(),
  purchase_orders_url: z.string().optional().nullable(),
  purchase_orders_doc_path: z.string().optional().nullable(),
});

export type ContractFormValues = z.infer<typeof contractFormSchema>;

export const hourlyRateEntrySchema = z.object({
  role: z.string().min(1),
  rate: z.coerce.number().min(0),
});

export const upsertHourlyRatesSchema = z.object({
  accountId: z.string().min(1),
  year: z.number().int().min(2000).max(2100),
  rates: z.array(hourlyRateEntrySchema).max(100),
});

export const slaRateFormSchema = z.object({
  fixed_monthly_rate: z.coerce.number().min(0),
  support_hourly_rate: z.coerce.number().min(0),
  tools: z.array(z.object({
    tool_name: z.string().min(1),
    monthly_price: z.coerce.number().min(0),
  })),
});

export type SlaRateFormValues = z.infer<typeof slaRateFormSchema>;
