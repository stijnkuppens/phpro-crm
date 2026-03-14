'use server';

import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/require-permission';
import { logAction } from '@/features/audit/actions/log-action';
import { revalidatePath } from 'next/cache';
import { ok, err, type ActionResult } from '@/lib/action-result';

const extendSchema = z.object({
  new_end_date: z.string().min(1, 'Nieuwe einddatum is verplicht'),
  notes: z.string().optional(),
});

export async function extendConsultant(
  id: string,
  values: z.infer<typeof extendSchema>,
): Promise<ActionResult> {
  if (!z.string().uuid().safeParse(id).success) return err('Ongeldig ID');
  await requirePermission('consultants.write');

  const parsed = extendSchema.safeParse(values);
  if (!parsed.success) {
    return err(parsed.error.flatten().fieldErrors);
  }

  const supabase = await createServerClient();

  const { error: extensionError } = await supabase
    .from('consultant_extensions')
    .insert({
      active_consultant_id: id,
      new_end_date: parsed.data.new_end_date,
      notes: parsed.data.notes ?? null,
    });

  if (extensionError) {
    return err(extensionError.message);
  }

  const { error: updateError } = await supabase
    .from('active_consultants')
    .update({ end_date: parsed.data.new_end_date })
    .eq('id', id);

  if (updateError) {
    return err(updateError.message);
  }

  await logAction({
    action: 'active_consultant.extended',
    entityType: 'active_consultant',
    entityId: id,
    metadata: { new_end_date: parsed.data.new_end_date },
  });

  revalidatePath('/admin/consultants');
  return ok();
}
