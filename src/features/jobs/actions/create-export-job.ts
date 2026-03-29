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

  // 1. Insert job row
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

  // 2. Enqueue to pgmq
  const { error: queueError } = await supabase.rpc('enqueue_export_job', {
    p_job_id: job.id,
  });

  if (queueError) {
    await supabase
      .from('jobs')
      .update({ status: 'failed', error: `Queue error: ${queueError.message}` })
      .eq('id', job.id);
    return err('Kon export niet in de wachtrij plaatsen');
  }

  revalidatePath('/admin/jobs');
  return ok({ id: job.id });
}
