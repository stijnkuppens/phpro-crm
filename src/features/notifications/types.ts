import { z } from 'zod';
import type { Database } from '@/types/database';

export type Notification = Database['public']['Tables']['notifications']['Row'];

/** Alias used by the DataTable list component */
export type NotificationListItem = Notification;

export const NOTIFICATION_READ_STYLES: Record<string, string> = {
  ongelezen: 'bg-blue-100 text-blue-700',
  gelezen: 'bg-muted text-muted-foreground',
};

export const createNotificationSchema = z.object({
  userId: z.string().min(1, 'userId is verplicht'),
  title: z.string().min(1, 'Titel is verplicht').max(200),
  message: z.string().max(1000).optional(),
  link: z.string().max(500).optional(),
});
