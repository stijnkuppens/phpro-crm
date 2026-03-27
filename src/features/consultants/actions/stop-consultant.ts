'use server';

import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/require-permission';
import { logAction } from '@/features/audit/actions/log-action';
import { revalidatePath } from 'next/cache';
import { ok, err, type ActionResult } from '@/lib/action-result';

const stopSchema = z.object({
  stop_date: z.string().min(1, 'Stopdatum is verplicht'),
  stop_reason: z.string().optional(),
});

export async function stopConsultant(
  id: string,
  values: z.infer<typeof stopSchema>,
): Promise<ActionResult> {
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
  const { error } = await supabase
    .from('consultants')
    .update({
      status: 'stopgezet' as const,
      stop_date: parsed.data.stop_date,
      stop_reason: parsed.data.stop_reason ?? null,
    })
    .eq('id', id);

  if (error) {
    return err(error.message);
  }

  await logAction({
    action: 'consultant.stopped',
    entityType: 'consultant',
    entityId: id,
    metadata: { stop_date: parsed.data.stop_date, stop_reason: parsed.data.stop_reason ?? null },
  });

  revalidatePath('/admin/consultants');
  return ok();
}
