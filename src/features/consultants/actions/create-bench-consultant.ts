'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { logAction } from '@/features/audit/actions/log-action';
import { type ActionResult, err, ok } from '@/lib/action-result';
import { logger } from '@/lib/logger';
import { requirePermission } from '@/lib/require-permission';
import { createServerClient } from '@/lib/supabase/server';
import { type BenchConsultantFormValues, benchConsultantFormSchema } from '../types';

export async function createBenchConsultant(values: BenchConsultantFormValues): Promise<ActionResult<{ id: string }>> {
  try {
    await requirePermission('consultants.write');
  } catch {
    return err('Onvoldoende rechten');
  }

  const parsed = benchConsultantFormSchema.safeParse(values);
  if (!parsed.success) {
    return err(z.flattenError(parsed.error).fieldErrors);
  }

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('consultants')
    .insert({ ...parsed.data, status: 'bench' as const })
    .select('id')
    .single();

  if (error) {
    logger.error({ err: error }, '[createBenchConsultant] database error');
    return err('Er is een fout opgetreden');
  }

  await logAction({
    action: 'consultant.created',
    entityType: 'consultant',
    entityId: data.id,
    metadata: { name: `${parsed.data.first_name} ${parsed.data.last_name}`, body: parsed.data },
  });

  revalidatePath('/admin/consultants');
  return ok(data);
}
