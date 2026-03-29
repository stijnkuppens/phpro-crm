'use server';

import { revalidatePath } from 'next/cache';
import { createServiceRoleClient } from '@/lib/supabase/admin';
import { requirePermission } from '@/lib/require-permission';
import { ok, err, type ActionResult } from '@/lib/action-result';
import { z } from 'zod';

export async function deleteJob(id: string): Promise<ActionResult> {
  const { userId } = await requirePermission('jobs.read');

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

  const { error: deleteError } = await supabase
    .from('jobs')
    .delete()
    .eq('id', id);

  if (deleteError) return err(deleteError.message);

  revalidatePath('/admin/jobs');
  return ok();
}
