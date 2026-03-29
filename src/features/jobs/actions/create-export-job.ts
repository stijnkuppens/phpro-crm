'use server';

import { revalidatePath } from 'next/cache';
import { createServiceRoleClient } from '@/lib/supabase/admin';
import { requirePermission } from '@/lib/require-permission';
import { ok, err, type ActionResult } from '@/lib/action-result';
import { createExportJobSchema, type CreateExportJobValues } from '../types';

export async function createExportJob(
  values: CreateExportJobValues,
): Promise<ActionResult<{ id: string }>> {
  const { userId } = await requirePermission('jobs.read');

  const parsed = createExportJobSchema.safeParse(values);
  if (!parsed.success) {
    return err(parsed.error.flatten().fieldErrors);
  }

  const { entity, format, filters, columns, selectQuery } = parsed.data;
  const supabase = createServiceRoleClient();

  const { data: job, error: jobError } = await supabase
    .from('jobs')
    .insert({
      type: 'export',
      entity,
      format,
      filters: { ...filters, columns },
      select_query: selectQuery ?? '*',
      requested_by: userId,
    })
    .select('id')
    .single();

  if (jobError) return err(jobError.message);

  // The AFTER INSERT trigger on the jobs table automatically calls
  // the Edge Function via pg_net — no manual dispatch needed.

  revalidatePath('/admin/jobs');
  return ok({ id: job.id });
}
