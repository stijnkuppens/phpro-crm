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
  if (!z.string().uuid().safeParse(id).success) return err('Ongeldig ID');
  await requirePermission('consultants.write');

  const parsed = stopSchema.safeParse(values);
  if (!parsed.success) {
    return err(parsed.error.flatten().fieldErrors);
  }

  const supabase = await createServerClient();
  const { error } = await supabase
    .from('active_consultants')
    .update({
      is_stopped: true,
      is_active: false,
      stop_date: parsed.data.stop_date,
      stop_reason: parsed.data.stop_reason ?? null,
    })
    .eq('id', id);

  if (error) {
    return err(error.message);
  }

  await logAction({
    action: 'active_consultant.stopped',
    entityType: 'active_consultant',
    entityId: id,
    metadata: { stop_date: parsed.data.stop_date, stop_reason: parsed.data.stop_reason ?? null },
  });

  revalidatePath('/admin/consultants');
  return ok();
}
