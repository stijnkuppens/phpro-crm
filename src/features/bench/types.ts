import { z } from 'zod';
import type { Database } from '@/types/database';

export type BenchConsultant = Database['public']['Tables']['bench_consultants']['Row'];
export type BenchConsultantLanguage = Database['public']['Tables']['bench_consultant_languages']['Row'];

export type BenchConsultantWithLanguages = BenchConsultant & {
  languages: BenchConsultantLanguage[];
};

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

export const languageFormSchema = z.object({
  language: z.string().min(1),
  level: z.enum(['Basis', 'Gevorderd', 'Vloeiend', 'Moedertaal']),
});

export type LanguageFormValues = z.infer<typeof languageFormSchema>;
