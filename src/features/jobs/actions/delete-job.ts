'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { type ActionResult, err, ok } from '@/lib/action-result';
import { logger } from '@/lib/logger';
import { requirePermission } from '@/lib/require-permission';
import { createServiceRoleClient } from '@/lib/supabase/admin';

export async function deleteJob(id: string): Promise<ActionResult> {
  let userId: string;
  try {
    ({ userId } = await requirePermission('jobs.read'));
  } catch {
    return err('Onvoldoende rechten');
  }

  if (!z.string().min(1).safeParse(id).success) {
    return err('Ongeldig job ID');
  }

  const supabase = createServiceRoleClient();

  const { data: job, error: fetchError } = await supabase
    .from('jobs')
    .select('id, requested_by, file_path')
    .eq('id', id)
    .single();

  if (fetchError || !job) return err('Job niet gevonden');
  if (job.requested_by !== userId) return err('Geen toegang');

  if (job.file_path) {
    await supabase.storage.from('documents').remove([job.file_path]);
  }

  const { error: deleteError } = await supabase.from('jobs').delete().eq('id', id);

  if (deleteError) {
    logger.error({ err: deleteError }, '[deleteJob] database error');
    return err('Er is een fout opgetreden');
  }

  revalidatePath('/admin/jobs');
  return ok();
}
