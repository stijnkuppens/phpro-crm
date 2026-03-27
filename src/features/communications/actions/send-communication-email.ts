'use server';

import { z } from 'zod';
import { sendEmail } from '@/lib/email';
import { ok, err, type ActionResult } from '@/lib/action-result';
import { requirePermission } from '@/lib/require-permission';
import { logger } from '@/lib/logger';

const schema = z.object({
  to: z.string().email('Ongeldig e-mailadres'),
  subject: z.string().min(1, 'Onderwerp is verplicht'),
  body: z.string().min(1, 'Inhoud is verplicht'),
  brand: z.enum(['phpro', '25carat']).default('phpro'),
});

export async function sendCommunicationEmail(
  values: z.infer<typeof schema>,
): Promise<ActionResult<{ messageId: string }>> {
  try {
    await requirePermission('communications.write');
  } catch {
    return err('Onvoldoende rechten');
  }

  const parsed = schema.safeParse(values);
  if (!parsed.success) return err(parsed.error.flatten().fieldErrors);

  try {
    const result = await sendEmail(parsed.data);
    return ok(result);
  } catch (e) {
    logger.error({ err: e, entity: 'communications' }, 'Failed to send email');
    return err('E-mail kon niet worden verstuurd');
  }
}
