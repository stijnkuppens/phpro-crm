'use server';

import { z } from 'zod';
import { sendEmail } from '@/lib/email';
import { ok, err, type ActionResult } from '@/lib/action-result';

const schema = z.object({
  to: z.string().email('Ongeldig e-mailadres'),
  subject: z.string().min(1, 'Onderwerp is verplicht'),
  body: z.string().min(1, 'Inhoud is verplicht'),
  brand: z.enum(['phpro', '25carat']).default('phpro'),
});

export async function sendCommunicationEmail(
  values: z.infer<typeof schema>,
): Promise<ActionResult<{ messageId: string }>> {
  const parsed = schema.safeParse(values);
  if (!parsed.success) return err(parsed.error.flatten().fieldErrors);

  try {
    const result = await sendEmail(parsed.data);
    return ok(result);
  } catch (e) {
    console.error('Failed to send email:', e);
    return err('E-mail kon niet worden verstuurd');
  }
}
