import { z } from 'zod';
import type { Database } from '@/types/database';

export type Notification = Database['public']['Tables']['notifications']['Row'];

export const createNotificationSchema = z.object({
  userId: z.string().min(1, 'userId is verplicht'),
  title: z.string().min(1, 'Titel is verplicht').max(200),
  message: z.string().max(1000).optional(),
  link: z.string().max(500).optional(),
});
