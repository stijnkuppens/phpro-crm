import { z } from 'zod';
import type { Database } from '@/types/database';

export type IndexationIndex = Database['public']['Tables']['indexation_indices']['Row'];
export type IndexationDraft = Database['public']['Tables']['indexation_drafts']['Row'];
export type IndexationDraftRate = Database['public']['Tables']['indexation_draft_rates']['Row'];
export type IndexationDraftSla = Database['public']['Tables']['indexation_draft_sla']['Row'];
export type IndexationHistory = Database['public']['Tables']['indexation_history']['Row'];
export type IndexationConfig = Database['public']['Tables']['indexation_config']['Row'];

export type IndexationDraftFull = IndexationDraft & {
  rates: IndexationDraftRate[];
  sla: IndexationDraftSla | null;
  sla_tools: Database['public']['Tables']['indexation_draft_sla_tools']['Row'][];
};

export type SimulationResult = {
  rates: { role: string; current_rate: number; proposed_rate: number }[];
  sla: {
    fixed_monthly_rate: number;
    support_hourly_rate: number;
    proposed_fixed: number;
    proposed_support: number;
  } | null;
};

export const indexationConfigSchema = z.object({
  target_year: z.coerce.number(),
  base_year: z.coerce.number(),
  percentage: z.coerce.number().min(0).max(100),
});

export const indexationDraftSchema = z.object({
  target_year: z.coerce.number(),
  base_year: z.coerce.number(),
  percentage: z.coerce.number(),
  info: z.string().optional(),
  adjustment_pct_hourly: z.coerce.number().optional().nullable(),
  adjustment_pct_sla: z.coerce.number().optional().nullable(),
  rates: z.array(z.object({
    role: z.string(),
    current_rate: z.coerce.number(),
    proposed_rate: z.coerce.number(),
  })),
  sla: z.object({
    fixed_monthly_rate: z.coerce.number(),
    support_hourly_rate: z.coerce.number(),
  }).optional().nullable(),
  sla_tools: z.array(z.object({
    tool_name: z.string(),
    proposed_price: z.coerce.number(),
  })).optional(),
});

export type IndexationDraftValues = z.infer<typeof indexationDraftSchema>;

export const indexationConfigFormSchema = z.object({
  account_id: z.string().min(1),
  indexation_type: z.string().optional().nullable(),
  start_month: z.coerce.number().optional().nullable(),
  start_year: z.coerce.number().optional().nullable(),
});

export type IndexationConfigFormValues = z.infer<typeof indexationConfigFormSchema>;
