'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { logAction } from '@/features/audit/actions/log-action';
import { type ActionResult, err, ok } from '@/lib/action-result';
import { logger } from '@/lib/logger';
import { requirePermission } from '@/lib/require-permission';
import { createServerClient } from '@/lib/supabase/server';

const stopSchema = z.object({
  stop_date: z.string().min(1, 'Stopdatum is verplicht'),
  stop_reason: z.string().optional(),
});

export async function stopConsultant(id: string, values: z.infer<typeof stopSchema>): Promise<ActionResult> {
  try {
    await requirePermission('consultants.write');
  } catch {
    return err('Onvoldoende rechten');
  }
  if (!z.string().min(1).safeParse(id).success) return err('Ongeldig ID');

  const parsed = stopSchema.safeParse(values);
  if (!parsed.success) {
    return err(z.flattenError(parsed.error).fieldErrors);
  }

  const supabase = await createServerClient();
  const { data: before } = await supabase.from('consultants').select('*').eq('id', id).single();
  const { error } = await supabase
    .from('consultants')
    .update({
      status: 'stopgezet' as const,
      stop_date: parsed.data.stop_date,
      stop_reason: parsed.data.stop_reason ?? null,
    })
    .eq('id', id);

  if (error) {
    logger.error({ err: error }, '[stopConsultant] database error');
    return err('Er is een fout opgetreden');
  }

  await logAction({
    action: 'consultant.stopped',
    entityType: 'consultant',
    entityId: id,
    metadata: { stop_date: parsed.data.stop_date, stop_reason: parsed.data.stop_reason ?? null, before },
  });

  revalidatePath('/admin/consultants');
  return ok();
}
