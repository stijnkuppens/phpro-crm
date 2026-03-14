'use server';

import { createServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/require-permission';
import { logAction } from '@/features/audit/actions/log-action';
import { revalidatePath } from 'next/cache';
import { activeConsultantFormSchema, type ActiveConsultantFormValues } from '../types';
import { ok, err, type ActionResult } from '@/lib/action-result';

export async function createActiveConsultant(
  values: ActiveConsultantFormValues,
): Promise<ActionResult<{ id: string }>> {
  await requirePermission('consultants.write');

  const parsed = activeConsultantFormSchema.safeParse(values);
  if (!parsed.success) {
    return err(parsed.error.flatten().fieldErrors);
  }

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('active_consultants')
    .insert(parsed.data)
    .select('id')
    .single();

  if (error) {
    return err(error.message);
  }

  // Create initial rate history entry
  const { error: rateError } = await supabase
    .from('consultant_rate_history')
    .insert({
      active_consultant_id: data.id,
      date: parsed.data.start_date,
      rate: parsed.data.hourly_rate,
      reason: 'Initieel tarief',
    });

  if (rateError) {
    return err(rateError.message);
  }

  await logAction({
    action: 'active_consultant.created',
    entityType: 'active_consultant',
    entityId: data.id,
    metadata: { name: `${parsed.data.first_name} ${parsed.data.last_name}` },
  });

  revalidatePath('/admin/consultants');
  return ok(data);
}
