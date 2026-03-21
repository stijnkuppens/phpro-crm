'use server';

import { createServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/require-permission';
import { logAction } from '@/features/audit/actions/log-action';
import { revalidatePath } from 'next/cache';
import { benchConsultantFormSchema, type BenchConsultantFormValues } from '../types';
import { ok, err, type ActionResult } from '@/lib/action-result';

export async function createBenchConsultant(
  values: BenchConsultantFormValues,
): Promise<ActionResult<{ id: string }>> {
  try {
    await requirePermission('consultants.write');
  } catch {
    return err('Onvoldoende rechten');
  }

  const parsed = benchConsultantFormSchema.safeParse(values);
  if (!parsed.success) {
    return err(parsed.error.flatten().fieldErrors);
  }

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('consultants')
    .insert({ ...parsed.data, status: 'bench' as const })
    .select('id')
    .single();

  if (error) {
    return err(error.message);
  }

  await logAction({
    action: 'consultant.created',
    entityType: 'consultant',
    entityId: data.id,
    metadata: { name: `${parsed.data.first_name} ${parsed.data.last_name}` },
  });

  revalidatePath('/admin/consultants');
  return ok(data);
}
