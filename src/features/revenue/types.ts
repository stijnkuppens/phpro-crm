import { z } from 'zod';
import type { Database } from '@/types/database';

export type Division = Database['public']['Tables']['divisions']['Row'];
export type DivisionService = Database['public']['Tables']['division_services']['Row'];
export type RevenueClient = Database['public']['Tables']['revenue_clients']['Row'];
export type RevenueClientDivision = Database['public']['Tables']['revenue_client_divisions']['Row'];
export type RevenueClientService = Database['public']['Tables']['revenue_client_services']['Row'];
export type RevenueEntry = Database['public']['Tables']['revenue_entries']['Row'];
export type AccountRevenue = Database['public']['Tables']['account_revenue']['Row'];

export type RevenueClientFull = RevenueClient & {
  divisions: (RevenueClientDivision & { division: Division })[];
  services: RevenueClientService[];
};

export type DivisionWithServices = Division & {
  services: DivisionService[];
};

export type RevenueData = Record<
  string, Record<string, Record<string, Record<number, number[]>>>
>;

export const accountRevenueFormSchema = z.object({
  year: z.coerce.number(),
  category: z.string().min(1, 'Categorie is verplicht'),
  amount: z.coerce.number().min(0),
  notes: z.string().optional(),
});

export type AccountRevenueFormValues = z.infer<typeof accountRevenueFormSchema>;

export const revenueEntryFormSchema = z.object({
  revenue_client_id: z.string().min(1),
  division_id: z.string().min(1),
  service_name: z.string().min(1),
  year: z.coerce.number(),
  month: z.coerce.number().min(0).max(11),
  amount: z.coerce.number().min(0),
});

export type RevenueEntryFormValues = z.infer<typeof revenueEntryFormSchema>;
