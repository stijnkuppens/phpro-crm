import type { Database } from '@/types/database';
import { z } from 'zod';

export type Contact = Database['public']['Tables']['contacts']['Row'];
export type ContactInsert = Database['public']['Tables']['contacts']['Insert'];

export const contactSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  company: z.string().optional(),
  notes: z.string().optional(),
});

export type ContactFormValues = z.infer<typeof contactSchema>;
