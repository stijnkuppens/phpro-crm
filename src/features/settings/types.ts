import { z } from 'zod';

export const settingsSchema = z.object({
  app_name: z.string(),
  logo_url: z.string(),
});

export type SettingsValues = z.infer<typeof settingsSchema>;
