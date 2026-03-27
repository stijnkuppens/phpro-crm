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
  try {
    await requirePermission('consultants.write');
  } catch {
    return err('Onvoldoende rechten');
  }
  if (!z.string().min(1).safeParse(id).success) return err('Ongeldig ID');

  const parsed = extendSchema.safeParse(values);
  if (!parsed.success) {
    return err(z.flattenError(parsed.error).fieldErrors);
  }

  const supabase = await createServerClient();

  const { error: extensionError } = await supabase
    .from('consultant_extensions')
    .insert({
      consultant_id: id,
      new_end_date: parsed.data.new_end_date,
      notes: parsed.data.notes ?? null,
    });

  if (extensionError) {
    return err(extensionError.message);
  }

  const { error: updateError } = await supabase
    .from('consultants')
    .update({ end_date: parsed.data.new_end_date, is_indefinite: false })
    .eq('id', id);

  if (updateError) {
    return err(updateError.message);
  }

  await logAction({
    action: 'consultant.extended',
    entityType: 'consultant',
    entityId: id,
    metadata: { new_end_date: parsed.data.new_end_date },
  });

  revalidatePath('/admin/consultants');
  return ok();
}
