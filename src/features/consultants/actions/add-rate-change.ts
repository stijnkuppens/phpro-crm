'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { logAction } from '@/features/audit/actions/log-action';
import { type ActionResult, err, ok } from '@/lib/action-result';
import { logger } from '@/lib/logger';
import { requirePermission } from '@/lib/require-permission';
import { createServerClient } from '@/lib/supabase/server';

const rateChangeSchema = z.object({
  date: z.string().min(1, 'Datum is verplicht'),
  rate: z.coerce.number().min(0, 'Tarief is verplicht'),
  reason: z.string().optional(),
  notes: z.string().optional(),
});

export async function addRateChange(id: string, values: z.infer<typeof rateChangeSchema>): Promise<ActionResult> {
  try {
    await requirePermission('consultants.write');
  } catch {
    return err('Onvoldoende rechten');
  }
  if (!z.string().min(1).safeParse(id).success) return err('Ongeldig ID');

  const parsed = rateChangeSchema.safeParse(values);
  if (!parsed.success) {
    return err(z.flattenError(parsed.error).fieldErrors);
  }

  const supabase = await createServerClient();
  const { data: before } = await supabase.from('consultants').select('*').eq('id', id).single();

  const { error: historyError } = await supabase.from('consultant_rate_history').insert({
    consultant_id: id,
    date: parsed.data.date,
    rate: parsed.data.rate,
    reason: parsed.data.reason ?? null,
    notes: parsed.data.notes ?? null,
  });

  if (historyError) {
    logger.error({ err: historyError }, '[addRateChange] insert error');
    return err('Er is een fout opgetreden');
  }

  // Only update the current hourly_rate if the rate change is effective today or earlier
  const rateDate = new Date(parsed.data.date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (rateDate <= today) {
    const { error: updateError } = await supabase
      .from('consultants')
      .update({ hourly_rate: parsed.data.rate })
      .eq('id', id);

    if (updateError) {
      logger.error({ err: updateError }, '[addRateChange] update error');
      return err('Er is een fout opgetreden');
    }
  }

  await logAction({
    action: 'consultant.rate_changed',
    entityType: 'consultant',
    entityId: id,
    metadata: { date: parsed.data.date, rate: parsed.data.rate, reason: parsed.data.reason ?? null, before },
  });

  revalidatePath('/admin/consultants');
  return ok();
}
